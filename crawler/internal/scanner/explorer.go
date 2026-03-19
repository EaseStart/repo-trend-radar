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

// Explorer discovers new repos by rotating through seed topics.
type Explorer struct {
	client *github.Client
	db     *db.Database
}

// NewExplorer creates a new Explorer scanner.
func NewExplorer(client *github.Client, database *db.Database) *Explorer {
	return &Explorer{client: client, db: database}
}

// Discover rotates through seed topics and adds new repos to the DB.
func (e *Explorer) Discover(ctx context.Context) (int, error) {
	// Get seed topics, rotating based on day of year
	var topics []db.SeedTopic
	if err := e.db.Select(&topics, `SELECT * FROM seed_topics ORDER BY last_scanned_at ASC NULLS FIRST LIMIT 5`); err != nil {
		return 0, fmt.Errorf("get seed topics: %w", err)
	}

	if len(topics) == 0 {
		return 0, fmt.Errorf("no seed topics found — run SeedTopics first")
	}

	totalDiscovered := 0

	for _, topic := range topics {
		repos, err := e.client.SearchRepos(ctx, topic.Topic, 1, 10000)
		if err != nil {
			log.Printf("Explorer: search error for topic %s: %v", topic.Topic, err)
			continue
		}

		for _, r := range repos {
			if r.GetID() == 0 {
				continue
			}

			// Check if already tracked
			var exists int
			e.db.Get(&exists, `SELECT COUNT(*) FROM repos WHERE id = ?`, r.GetID())
			if exists > 0 {
				continue
			}

			// Determine zone based on star count
			zone := "seedling"
			if r.GetStargazersCount() >= 100 {
				zone = "rising"
			}

			// Extract topics
			topicNames := make([]string, 0)
			for _, t := range r.Topics {
				topicNames = append(topicNames, t)
			}
			topicsJSON, _ := json.Marshal(topicNames)

			desc := r.GetDescription()
			lang := r.GetLanguage()
			repo := &db.Repo{
				ID:           r.GetID(),
				FullName:     r.GetFullName(),
				Description:  &desc,
				Language:     &lang,
				Topics:       string(topicsJSON),
				Zone:         zone,
				Stars:        r.GetStargazersCount(),
				Forks:        r.GetForksCount(),
				OpenIssues:   r.GetOpenIssuesCount(),
				Watchers:     r.GetWatchersCount(),
				DiscoveredAt: db.Now(),
			}

			if err := e.db.UpsertRepo(repo); err != nil {
				log.Printf("Explorer: upsert error for %s: %v", r.GetFullName(), err)
				continue
			}

			totalDiscovered++
			log.Printf("Explorer: discovered %s (%d⭐, zone=%s)", r.GetFullName(), r.GetStargazersCount(), zone)
		}

		// Mark topic as scanned
		e.db.Exec(`UPDATE seed_topics SET last_scanned_at = datetime('now'), repo_count = (
			SELECT COUNT(*) FROM repos WHERE topics LIKE ?
		) WHERE topic = ?`, "%"+topic.Topic+"%", topic.Topic)
	}

	// Organic topic expansion: find topics shared by 3+ tracked repos that aren't seeds
	e.expandTopics()

	// Log the scan
	e.db.Exec(`INSERT INTO scan_log (started_at, finished_at, phase, repos_scanned) VALUES (datetime('now'), datetime('now'), 'explorer', ?)`, totalDiscovered)

	return totalDiscovered, nil
}

// expandTopics adds new seed topics organically from tracked repos.
func (e *Explorer) expandTopics() {
	var repos []db.Repo
	e.db.Select(&repos, `SELECT topics FROM repos WHERE zone IN ('seedling', 'rising', 'breakout')`)

	topicCount := make(map[string]int)
	for _, r := range repos {
		var topics []string
		json.Unmarshal([]byte(r.Topics), &topics)
		for _, t := range topics {
			t = strings.ToLower(strings.TrimSpace(t))
			if t != "" {
				topicCount[t]++
			}
		}
	}

	for topic, count := range topicCount {
		if count >= 3 {
			// Only add if not already a seed
			var exists int
			e.db.Get(&exists, `SELECT COUNT(*) FROM seed_topics WHERE topic = ?`, topic)
			if exists == 0 {
				e.db.Exec(`INSERT OR IGNORE INTO seed_topics (topic, source, added_at) VALUES (?, 'organic', datetime('now'))`, topic)
				log.Printf("Explorer: organically added seed topic '%s' (shared by %d repos)", topic, count)
			}
		}
	}

	// Cap seed topics at 50 (LRU eviction)
	var total int
	e.db.Get(&total, `SELECT COUNT(*) FROM seed_topics`)
	if total > 50 {
		e.db.Exec(`DELETE FROM seed_topics WHERE topic IN (
			SELECT topic FROM seed_topics WHERE source = 'organic' ORDER BY last_scanned_at ASC LIMIT ?
		)`, total-50)
	}
}

// ScanStartLog logs the start of a scan phase.
func ScanStartLog(database *db.Database, phase string) time.Time {
	start := time.Now()
	database.Exec(`INSERT INTO scan_log (started_at, phase) VALUES (?, ?)`, db.Now(), phase)
	return start
}
