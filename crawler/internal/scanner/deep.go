package scanner

import (
	"context"
	"log"

	"github.com/easestart/repo-trend-radar/crawler/internal/db"
	"github.com/easestart/repo-trend-radar/crawler/internal/github"
	"github.com/easestart/repo-trend-radar/crawler/internal/readme"
)

// DeepAnalyzer performs deep analysis on hot repos.
type DeepAnalyzer struct {
	client *github.Client
	db     *db.Database
}

// NewDeepAnalyzer creates a new DeepAnalyzer.
func NewDeepAnalyzer(client *github.Client, database *db.Database) *DeepAnalyzer {
	return &DeepAnalyzer{client: client, db: database}
}

// Analyze runs deep analysis on repos with high heat scores.
func (d *DeepAnalyzer) Analyze(ctx context.Context) error {
	// Get hot repos (heat > 0.3 = 1.5% daily growth)
	var hotRepos []db.Repo
	err := d.db.Select(&hotRepos, `SELECT * FROM repos WHERE zone IN ('rising', 'breakout') AND heat_score > 0.3 ORDER BY heat_score DESC LIMIT 20`)
	if err != nil {
		return err
	}

	if len(hotRepos) == 0 {
		log.Println("DeepAnalyzer: no hot repos to analyze")
		return nil
	}

	log.Printf("DeepAnalyzer: analyzing %d hot repos...", len(hotRepos))

	for _, repo := range hotRepos {
		ri := github.ParseFullName(repo.FullName)
		if ri.Owner == "" {
			continue
		}

		// 1. Fetch README and mine traction signals
		content, sha, err := d.client.FetchREADME(ctx, ri.Owner, ri.Name)
		if err != nil {
			log.Printf("DeepAnalyzer: README error for %s: %v", repo.FullName, err)
		} else if repo.ReadmeSHA == nil || sha != *repo.ReadmeSHA {
			signals := readme.MineTraction(content)
			d.db.Exec(`INSERT OR REPLACE INTO traction_signals (repo_id, scanned_at, has_star_chart, has_used_by, has_download_count, has_growth_chart, has_company_logos, badges)
				VALUES (?, datetime('now'), ?, ?, ?, ?, ?, '[]')`,
				repo.ID, signals.HasStarChart, signals.HasUsedBy, signals.HasDownloadCount, signals.HasGrowthChart, signals.HasCompanyLogos)
			d.db.Exec(`UPDATE repos SET readme_sha = ? WHERE id = ?`, sha, repo.ID)
			log.Printf("DeepAnalyzer: mined traction for %s (star_chart=%v, used_by=%v)", repo.FullName, signals.HasStarChart, signals.HasUsedBy)
		}

		// 2. Get contributor count
		contribCount, err := d.client.ContributorCount(ctx, ri.Owner, ri.Name)
		if err != nil {
			log.Printf("DeepAnalyzer: contributor error for %s: %v", repo.FullName, err)
		} else {
			d.db.Exec(`UPDATE repos SET contributors = ? WHERE id = ?`, contribCount, repo.ID)
		}

		// 3. Promote to breakout if heat is very high and not already breakout
		if repo.Zone == "rising" && repo.HeatScore > 0.6 {
			d.db.UpdateZone(repo.ID, "breakout")
			log.Printf("🔥 DeepAnalyzer: %s promoted to BREAKOUT (heat=%.2f)", repo.FullName, repo.HeatScore)
		}
	}

	d.db.Exec(`INSERT INTO scan_log (started_at, finished_at, phase, repos_scanned) VALUES (datetime('now'), datetime('now'), 'deep', ?)`, len(hotRepos))
	return nil
}
