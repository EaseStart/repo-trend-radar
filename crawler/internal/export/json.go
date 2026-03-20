package export

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"os"
	"path/filepath"

	"github.com/easestart/repo-trend-radar/crawler/internal/db"
)

// GenerateAll exports all JSON files for the dashboard.
func GenerateAll(database *db.Database, outputDir string) error {
	if err := os.MkdirAll(outputDir, 0o755); err != nil {
		return fmt.Errorf("create output dir: %w", err)
	}

	if err := exportStats(database, outputDir); err != nil {
		log.Printf("Export stats error: %v", err)
	}
	if err := exportClusters(database, outputDir); err != nil {
		log.Printf("Export clusters error: %v", err)
	}
	if err := exportRepos(database, outputDir); err != nil {
		log.Printf("Export repos error: %v", err)
	}
	if err := exportTopics(database, outputDir); err != nil {
		log.Printf("Export topics error: %v", err)
	}
	if err := exportGraduated(database, outputDir); err != nil {
		log.Printf("Export graduated error: %v", err)
	}

	log.Printf("📦 Exported all JSON files to %s", outputDir)
	return nil
}

func exportStats(database *db.Database, dir string) error {
	stats, err := database.Stats()
	if err != nil {
		return err
	}
	return writeJSON(filepath.Join(dir, "stats.json"), stats)
}

type ClusterExport struct {
	ID                   int64             `json:"id"`
	Topic                string            `json:"topic"`
	DetectedAt           string            `json:"detectedAt"`
	GrowingCount         int               `json:"growingCount"`
	TotalCount           int               `json:"totalCount"`
	CoveragePct          float64           `json:"coveragePct"`
	Confidence           float64           `json:"confidence"`
	AvgVelocity          float64           `json:"avgVelocity"`
	GraduatedCorrelation int               `json:"graduatedCorrelation"`
	GrowingRepos         []db.RepoVelocity `json:"growingRepos"`
	Status               string            `json:"status"`
}

func exportClusters(database *db.Database, dir string) error {
	alerts, err := database.ActiveClusterAlerts()
	if err != nil {
		return err
	}

	exports := make([]ClusterExport, 0, len(alerts))
	for _, a := range alerts {
		var repos []db.RepoVelocity
		json.Unmarshal([]byte(a.GrowingRepos), &repos)

		exports = append(exports, ClusterExport{
			ID:                   a.ID,
			Topic:                a.Topic,
			DetectedAt:           a.DetectedAt,
			GrowingCount:         a.GrowingCount,
			TotalCount:           a.TotalCount,
			CoveragePct:          a.CoveragePct,
			Confidence:           a.Confidence,
			AvgVelocity:          a.AvgVelocity,
			GraduatedCorrelation: a.GraduatedCorrelation,
			GrowingRepos:         repos,
			Status:               a.Status,
		})
	}

	return writeJSON(filepath.Join(dir, "clusters.json"), exports)
}

type RepoExport struct {
	ID               int64           `json:"id"`
	FullName         string          `json:"fullName"`
	Description      string          `json:"description"`
	Language         string          `json:"language"`
	Topics           []string        `json:"topics"`
	Zone             string          `json:"zone"`
	Stars            int             `json:"stars"`
	Forks            int             `json:"forks"`
	HeatScore        float64         `json:"heatScore"`
	VelocityHistory  []VelocityPoint `json:"velocityHistory"`
	TractionSignals  *TractionExport `json:"tractionSignals"`
}

type VelocityPoint struct {
	Date         string `json:"date"`
	Stars        int    `json:"stars"`
	StarVelocity int    `json:"starVelocity"`
}

type TractionExport struct {
	HasStarChart     bool     `json:"hasStarChart"`
	HasUsedBy        bool     `json:"hasUsedBy"`
	HasDownloadCount bool     `json:"hasDownloadCount"`
	HasGrowthChart   bool     `json:"hasGrowthChart"`
	Badges           []string `json:"badges"`
}

func exportRepos(database *db.Database, dir string) error {
	var repos []db.Repo
	err := database.Select(&repos, `SELECT * FROM repos WHERE zone != 'graduated' ORDER BY heat_score DESC`)
	if err != nil {
		return err
	}

	// ADDITIVE: read existing repos.json to preserve previously exported repos
	existingPath := filepath.Join(dir, "repos.json")
	existingMap := make(map[string]RepoExport)
	if data, err := os.ReadFile(existingPath); err == nil {
		var existing []RepoExport
		if json.Unmarshal(data, &existing) == nil {
			for _, e := range existing {
				existingMap[e.FullName] = e
			}
			log.Printf("📂 Loaded %d existing repos from repos.json", len(existingMap))
		}
	}

	// Build new exports from DB (takes priority over existing)
	for _, r := range repos {
		var topics []string
		json.Unmarshal([]byte(r.Topics), &topics)

		// Get 30-day velocity history
		var history []VelocityPoint
		database.Select(&history, `
			SELECT date, stars, star_velocity as "starVelocity"
			FROM snapshots WHERE repo_id = ? ORDER BY date DESC LIMIT 30
		`, r.ID)

		// Get traction signals
		var traction db.TractionSignal
		var tractionExport *TractionExport
		if err := database.Get(&traction, `SELECT * FROM traction_signals WHERE repo_id = ? ORDER BY scanned_at DESC LIMIT 1`, r.ID); err == nil {
			var badges []string
			json.Unmarshal([]byte(traction.Badges), &badges)
			tractionExport = &TractionExport{
				HasStarChart:     traction.HasStarChart,
				HasUsedBy:        traction.HasUsedBy,
				HasDownloadCount: traction.HasDownloadCount,
				HasGrowthChart:   traction.HasGrowthChart,
				Badges:           badges,
			}
		}

		existingMap[r.FullName] = RepoExport{
			ID:              r.ID,
			FullName:        r.FullName,
			Description:     derefStr(r.Description),
			Language:        derefStr(r.Language),
			Topics:          topics,
			Zone:            r.Zone,
			Stars:           r.Stars,
			Forks:           r.Forks,
			HeatScore:       math.Round(r.HeatScore*100) / 100,
			VelocityHistory: history,
			TractionSignals: tractionExport,
		}
	}

	// Convert map to sorted slice
	exports := make([]RepoExport, 0, len(existingMap))
	for _, e := range existingMap {
		exports = append(exports, e)
	}
	// Sort by heat score descending
	for i := 0; i < len(exports); i++ {
		for j := i + 1; j < len(exports); j++ {
			if exports[j].HeatScore > exports[i].HeatScore {
				exports[i], exports[j] = exports[j], exports[i]
			}
		}
	}

	log.Printf("📦 Exporting %d repos (additive merge)", len(exports))
	return writeJSON(existingPath, exports)
}

type TopicExport struct {
	Topic         string `json:"topic"`
	RepoCount     int    `json:"repoCount"`
	RisingCount   int    `json:"risingCount"`
	BreakoutCount int    `json:"breakoutCount"`
	GraduatedCount int   `json:"graduatedCount"`
	AvgVelocity   float64 `json:"avgVelocity"`
	IsCluster     bool   `json:"isCluster"`
}

func exportTopics(database *db.Database, dir string) error {
	var topics []db.SeedTopic
	database.Select(&topics, `SELECT * FROM seed_topics ORDER BY repo_count DESC`)

	exports := make([]TopicExport, 0)
	for _, t := range topics {
		var risingCount, breakoutCount, graduatedCount int
		database.Get(&risingCount, `SELECT COUNT(*) FROM repos WHERE zone = 'rising' AND topics LIKE ?`, "%"+t.Topic+"%")
		database.Get(&breakoutCount, `SELECT COUNT(*) FROM repos WHERE zone = 'breakout' AND topics LIKE ?`, "%"+t.Topic+"%")
		database.Get(&graduatedCount, `SELECT COUNT(*) FROM repos WHERE zone = 'graduated' AND topics LIKE ?`, "%"+t.Topic+"%")

		var avgVel float64
		database.Get(&avgVel, `SELECT COALESCE(AVG(r.heat_score), 0) FROM repos r WHERE r.zone IN ('rising', 'breakout') AND r.topics LIKE ?`, "%"+t.Topic+"%")

		var clusterCount int
		database.Get(&clusterCount, `SELECT COUNT(*) FROM cluster_alerts WHERE topic = ? AND status = 'active'`, t.Topic)

		exports = append(exports, TopicExport{
			Topic:         t.Topic,
			RepoCount:     t.RepoCount,
			RisingCount:   risingCount,
			BreakoutCount: breakoutCount,
			GraduatedCount: graduatedCount,
			AvgVelocity:   math.Round(avgVel*100) / 100,
			IsCluster:     clusterCount > 0,
		})
	}

	return writeJSON(filepath.Join(dir, "topics.json"), exports)
}

type GraduatedExport struct {
	ID           int64    `json:"id"`
	FullName     string   `json:"fullName"`
	Description  string   `json:"description"`
	Language     string   `json:"language"`
	Topics       []string `json:"topics"`
	FinalStars   int      `json:"finalStars"`
	FinalForks   int      `json:"finalForks"`
	GraduatedAt  string   `json:"graduatedAt"`
	DiscoveredAt string   `json:"discoveredAt"`
}

func exportGraduated(database *db.Database, dir string) error {
	var repos []db.Repo
	err := database.Select(&repos, `SELECT * FROM repos WHERE zone = 'graduated' ORDER BY stars DESC`)
	if err != nil {
		return err
	}

	exports := make([]GraduatedExport, 0)
	for _, r := range repos {
		var topics []string
		json.Unmarshal([]byte(r.Topics), &topics)

		gradAt := ""
		if r.GraduatedAt != nil {
			gradAt = *r.GraduatedAt
		}

		exports = append(exports, GraduatedExport{
			ID:           r.ID,
			FullName:     r.FullName,
			Description:  derefStr(r.Description),
			Language:     derefStr(r.Language),
			Topics:       topics,
			FinalStars:   r.Stars,
			FinalForks:   r.Forks,
			GraduatedAt:  gradAt,
			DiscoveredAt: r.DiscoveredAt,
		})
	}

	return writeJSON(filepath.Join(dir, "graduated.json"), exports)
}

func writeJSON(path string, data interface{}) error {
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()

	enc := json.NewEncoder(f)
	enc.SetIndent("", "  ")
	return enc.Encode(data)
}

func derefStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
