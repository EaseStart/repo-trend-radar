package cluster

import (
	"encoding/json"
	"log"
	"math"

	"github.com/easestart/repo-trend-radar/crawler/internal/db"
)

// Detect finds topics where multiple repos are growing simultaneously.
func Detect(database *db.Database) ([]db.ClusterAlert, error) {
	// Expire old alerts
	database.Exec(`UPDATE cluster_alerts SET status = 'expired' WHERE status = 'active' AND detected_at < datetime('now', '-7 days')`)

	// Get all active repos with recent velocity data
	type repoTopic struct {
		RepoID    int64   `db:"id"`
		FullName  string  `db:"full_name"`
		Topics    string  `db:"topics"`
		Stars     int     `db:"stars"`
		HeatScore float64 `db:"heat_score"`
	}

	var repos []repoTopic
	err := database.Select(&repos, `
		SELECT r.id, r.full_name, r.topics, r.stars, r.heat_score
		FROM repos r
		WHERE r.zone IN ('rising', 'breakout')
	`)
	if err != nil {
		return nil, err
	}

	// Build topic → repos map
	topicRepos := make(map[string][]repoTopic)
	for _, r := range repos {
		var topics []string
		json.Unmarshal([]byte(r.Topics), &topics)
		for _, t := range topics {
			topicRepos[t] = append(topicRepos[t], r)
		}
	}

	// Detect clusters
	var alerts []db.ClusterAlert

	for topic, tRepos := range topicRepos {
		if len(tRepos) < 3 {
			continue // Need at least 3 repos in a topic
		}

		// Count repos with meaningful growth (heat > 0.1 = 0.5% daily)
		growingRepos := make([]db.RepoVelocity, 0)
		for _, r := range tRepos {
			if r.HeatScore > 0.1 {
				// Get 7-day velocity
				var vel7d int
				database.Get(&vel7d, `
					SELECT COALESCE(SUM(star_velocity), 0)
					FROM snapshots
					WHERE repo_id = ? AND date >= date('now', '-7 days')
				`, r.RepoID)

				growthPct := 0.0
				if r.Stars > 0 {
					growthPct = float64(vel7d) / float64(r.Stars) * 100
				}

				growingRepos = append(growingRepos, db.RepoVelocity{
					FullName:       r.FullName,
					Stars:          r.Stars,
					StarVelocity7d: vel7d,
					GrowthPct:      math.Round(growthPct*100) / 100,
				})
			}
		}

		// Check cluster thresholds
		growingCount := len(growingRepos)
		totalCount := len(tRepos)
		coveragePct := float64(growingCount) / float64(totalCount) * 100

		// Require ≥3 growing repos AND ≥30% coverage
		if growingCount < 3 || coveragePct < 30 {
			continue
		}

		// Calculate average velocity
		totalVel := 0.0
		for _, r := range growingRepos {
			totalVel += r.GrowthPct
		}
		avgVelocity := totalVel / float64(growingCount)

		// Count graduated repos in same topic for correlation
		var graduatedCount int
		database.Get(&graduatedCount, `
			SELECT COUNT(*) FROM repos
			WHERE zone = 'graduated' AND topics LIKE ?
		`, "%"+topic+"%")

		// Calculate confidence
		confidence := CalculateConfidence(growingRepos, growingCount, coveragePct, graduatedCount, database)

		// Check if we already have an active alert for this topic
		var existingCount int
		database.Get(&existingCount, `SELECT COUNT(*) FROM cluster_alerts WHERE topic = ? AND status = 'active'`, topic)
		if existingCount > 0 {
			// Update existing alert
			database.Exec(`UPDATE cluster_alerts SET growing_count = ?, total_count = ?, coverage_pct = ?, confidence = ?, avg_velocity = ?, graduated_correlation = ?, growing_repos = ?, detected_at = datetime('now') WHERE topic = ? AND status = 'active'`,
				growingCount, totalCount, coveragePct, confidence, avgVelocity, graduatedCount, mustJSON(growingRepos), topic)
		} else {
			// Insert new alert
			alert := &db.ClusterAlert{
				Topic:                topic,
				DetectedAt:           db.Now(),
				GrowingCount:         growingCount,
				TotalCount:           totalCount,
				CoveragePct:          coveragePct,
				Confidence:           confidence,
				AvgVelocity:          avgVelocity,
				GraduatedCorrelation: graduatedCount,
				GrowingRepos:         mustJSON(growingRepos),
				Status:               "active",
			}
			database.InsertClusterAlert(alert)
		}

		alerts = append(alerts, db.ClusterAlert{
			Topic:                topic,
			GrowingCount:         growingCount,
			TotalCount:           totalCount,
			CoveragePct:          coveragePct,
			Confidence:           confidence,
			AvgVelocity:          avgVelocity,
			GraduatedCorrelation: graduatedCount,
		})

		log.Printf("🎯 Cluster: %s — %d/%d repos growing (%.0f%% coverage, %.0f%% confidence)",
			topic, growingCount, totalCount, coveragePct, confidence*100)
	}

	database.Exec(`INSERT INTO scan_log (started_at, finished_at, phase, repos_scanned) VALUES (datetime('now'), datetime('now'), 'cluster', ?)`, len(alerts))

	return alerts, nil
}

// CalculateConfidence computes multi-signal confidence score for a cluster.
func CalculateConfidence(growing []db.RepoVelocity, growingCount int, coveragePct float64, graduatedCount int, database *db.Database) float64 {
	if len(growing) == 0 {
		return 0
	}

	totalScore := 0.0

	for _, r := range growing {
		score := 0.0

		// Star growth (15%)
		starScore := math.Min(r.GrowthPct/10, 1.0) * 0.15
		score += starScore

		// Issue velocity (25%) — get from snapshots
		var issueVel int
		database.Get(&issueVel, `
			SELECT COALESCE(AVG(issue_velocity), 0) FROM snapshots
			WHERE repo_id = (SELECT id FROM repos WHERE full_name = ?) AND date >= date('now', '-7 days')
		`, r.FullName)
		score += math.Min(float64(issueVel)/5, 1.0) * 0.25

		// Fork growth (10%)
		score += math.Min(r.GrowthPct/5, 1.0) * 0.10

		// Traction signals (25% total: star_chart 10%, used_by 15%)
		var traction db.TractionSignal
		err := database.Get(&traction, `SELECT * FROM traction_signals WHERE repo_id = (SELECT id FROM repos WHERE full_name = ?) ORDER BY scanned_at DESC LIMIT 1`, r.FullName)
		if err == nil {
			if traction.HasStarChart {
				score += 0.10
			}
			if traction.HasUsedBy {
				score += 0.15
			}
		}

		totalScore += score
	}

	avgScore := totalScore / float64(len(growing))

	// Coverage bonus: more growing repos = higher confidence
	coverageBonus := 1.0 + math.Min(float64(growingCount)/5, 1.0)*0.3
	avgScore *= coverageBonus

	// Graduated correlation bonus
	if graduatedCount >= 2 {
		avgScore *= 1.2
	}

	// Clamp to 0-1
	if avgScore > 1.0 {
		avgScore = 1.0
	}

	return math.Round(avgScore*100) / 100
}

func mustJSON(v interface{}) string {
	b, _ := json.Marshal(v)
	return string(b)
}
