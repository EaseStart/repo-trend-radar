package scanner

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/easestart/repo-trend-radar/crawler/internal/db"
	"github.com/easestart/repo-trend-radar/crawler/internal/github"
)

// Tracker scans repos for growth metrics on a schedule.
type Tracker struct {
	client         *github.Client
	db             *db.Database
	starFloor      int // Seedling→Rising threshold (default 100)
	starCeiling    int // Rising→Graduated threshold (default 10000)
	seedlingDays   int // Days between seedling scans (default 3)
}

// NewTracker creates a new Tracker scanner.
func NewTracker(client *github.Client, database *db.Database) *Tracker {
	return &Tracker{
		client:       client,
		db:           database,
		starFloor:    100,
		starCeiling:  10000,
		seedlingDays: 3,
	}
}

// ScanRising scans all repos in the "rising" zone (daily).
func (t *Tracker) ScanRising(ctx context.Context) error {
	repos, err := t.db.ReposByZone("rising")
	if err != nil {
		return fmt.Errorf("get rising repos: %w", err)
	}

	if len(repos) == 0 {
		log.Println("Tracker: no rising repos to scan")
		return nil
	}

	log.Printf("Tracker: scanning %d rising repos...", len(repos))
	return t.scanRepos(ctx, repos, "tracker_rising")
}

// ScanSeedling scans all repos in the "seedling" zone (every 3 days).
func (t *Tracker) ScanSeedling(ctx context.Context) error {
	dayOfYear := time.Now().YearDay()
	if dayOfYear%t.seedlingDays != 0 {
		log.Printf("Tracker: skipping seedling scan (day %d, interval %d)", dayOfYear, t.seedlingDays)
		return nil
	}

	repos, err := t.db.ReposByZone("seedling")
	if err != nil {
		return fmt.Errorf("get seedling repos: %w", err)
	}

	if len(repos) == 0 {
		log.Println("Tracker: no seedling repos to scan")
		return nil
	}

	log.Printf("Tracker: scanning %d seedling repos...", len(repos))
	return t.scanRepos(ctx, repos, "tracker_seedling")
}

// scanRepos fetches metrics and records snapshots.
func (t *Tracker) scanRepos(ctx context.Context, repos []db.Repo, phase string) error {
	// Build identifiers for batch query
	identifiers := make([]github.RepoIdentifier, 0, len(repos))
	for _, r := range repos {
		identifiers = append(identifiers, github.ParseFullName(r.FullName))
	}

	// Fetch in batches
	scanned := 0
	for i := 0; i < len(identifiers); i += 50 {
		end := i + 50
		if end > len(identifiers) {
			end = len(identifiers)
		}

		batch := identifiers[i:end]
		metrics, err := t.client.BatchFetchRepos(ctx, batch)
		if err != nil {
			log.Printf("Tracker: batch error: %v", err)
			continue
		}

		for _, m := range metrics {
			// Record snapshot
			snap := &db.Snapshot{
				RepoID:     m.ID,
				Date:       db.Today(),
				Stars:      m.Stars,
				Forks:      m.Forks,
				OpenIssues: m.OpenIssues,
				Watchers:   m.Watchers,
			}

			if err := t.db.InsertSnapshot(snap); err != nil {
				log.Printf("Tracker: snapshot error for %s/%s: %v", m.Owner, m.Name, err)
				continue
			}

			// Update repo record
			topicsJSON, _ := json.Marshal(m.Topics)
			t.db.Exec(`UPDATE repos SET stars = ?, forks = ?, open_issues = ?, watchers = ?, topics = ?, pushed_at = ?, last_scanned_at = datetime('now') WHERE id = ?`,
				m.Stars, m.Forks, m.OpenIssues, m.Watchers, string(topicsJSON), m.PushedAt.Format(time.RFC3339), m.ID)

			// Update heat score
			heat := t.calculateHeat(m.ID)
			t.db.UpdateHeatScore(m.ID, heat)

			scanned++
		}
	}

	// Log scan
	t.db.Exec(`INSERT INTO scan_log (started_at, finished_at, phase, repos_scanned) VALUES (datetime('now'), datetime('now'), ?, ?)`, phase, scanned)

	log.Printf("Tracker: scanned %d/%d repos for %s", scanned, len(repos), phase)
	return nil
}

// calculateHeat computes a heat score (0-1) based on recent velocity.
func (t *Tracker) calculateHeat(repoID int64) float64 {
	var velocity struct {
		AvgVelocity float64 `db:"avg_vel"`
		Stars       int     `db:"stars"`
	}

	err := t.db.Get(&velocity, `
		SELECT
			COALESCE(AVG(star_velocity), 0) as avg_vel,
			COALESCE(MAX(stars), 1) as stars
		FROM snapshots
		WHERE repo_id = ? AND date >= date('now', '-7 days')
	`, repoID)
	if err != nil {
		return 0
	}

	if velocity.Stars == 0 {
		return 0
	}

	// Heat = average daily velocity as percentage of total stars
	dailyPct := velocity.AvgVelocity / float64(velocity.Stars)

	// Normalize to 0-1 range (5% daily growth = heat 1.0)
	heat := dailyPct / 0.05
	if heat > 1.0 {
		heat = 1.0
	}
	if heat < 0 {
		heat = 0
	}

	return heat
}

// Promote moves repos that crossed the star floor from seedling → rising.
func (t *Tracker) Promote(ctx context.Context) ([]db.Repo, error) {
	var candidates []db.Repo
	err := t.db.Select(&candidates, `SELECT * FROM repos WHERE zone = 'seedling' AND stars >= ?`, t.starFloor)
	if err != nil {
		return nil, err
	}

	promoted := make([]db.Repo, 0)
	for _, r := range candidates {
		if err := t.db.UpdateZone(r.ID, "rising"); err != nil {
			log.Printf("Promote error for %s: %v", r.FullName, err)
			continue
		}
		log.Printf("⬆️ Promoted %s to rising (%d⭐)", r.FullName, r.Stars)
		promoted = append(promoted, r)
	}

	return promoted, nil
}

// Graduate moves repos that crossed the star ceiling from rising → graduated.
func (t *Tracker) Graduate(ctx context.Context) ([]db.Repo, error) {
	var candidates []db.Repo
	err := t.db.Select(&candidates, `SELECT * FROM repos WHERE zone IN ('rising', 'breakout') AND stars >= ?`, t.starCeiling)
	if err != nil {
		return nil, err
	}

	graduated := make([]db.Repo, 0)
	for _, r := range candidates {
		if err := t.db.UpdateZone(r.ID, "graduated"); err != nil {
			log.Printf("Graduate error for %s: %v", r.FullName, err)
			continue
		}
		log.Printf("🏛️ Graduated %s (%d⭐)", r.FullName, r.Stars)
		graduated = append(graduated, r)
	}

	// Demote repos below star floor back to seedling
	t.db.Exec(`UPDATE repos SET zone = 'seedling' WHERE zone = 'rising' AND stars < ?`, t.starFloor)

	return graduated, nil
}

// Helper to suppress unused import warning
var _ = strings.TrimSpace
