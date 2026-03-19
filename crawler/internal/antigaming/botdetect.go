package antigaming

import (
	"log"
	"time"

	"github.com/easestart/repo-trend-radar/crawler/internal/db"
)

// IsSuspicious analyzes stargazer timestamps for bot-like patterns.
func IsSuspicious(repoID int64, database *db.Database) bool {
	// Check 1: Hourly spike detection
	// Get snapshots and check for abnormal single-day spikes
	var maxDailyVelocity int
	database.Get(&maxDailyVelocity, `
		SELECT COALESCE(MAX(star_velocity), 0) FROM snapshots 
		WHERE repo_id = ? AND date >= date('now', '-7 days')
	`, repoID)

	var avgDailyVelocity float64
	database.Get(&avgDailyVelocity, `
		SELECT COALESCE(AVG(star_velocity), 0) FROM snapshots
		WHERE repo_id = ? AND date >= date('now', '-30 days')
	`, repoID)

	// If max daily spike is >10x the monthly average, suspicious
	if avgDailyVelocity > 0 && float64(maxDailyVelocity) > avgDailyVelocity*10 {
		log.Printf("⚠️ Suspicious: repo %d has spike (%d vs avg %.0f)", repoID, maxDailyVelocity, avgDailyVelocity)
		return true
	}

	// Check 2: New repo with high stars (< 7 days old with > 1000 stars)
	var repo db.Repo
	err := database.Get(&repo, `SELECT * FROM repos WHERE id = ?`, repoID)
	if err != nil {
		return false
	}

	discovered, _ := time.Parse(time.RFC3339, repo.DiscoveredAt)
	daysSinceDiscovery := time.Since(discovered).Hours() / 24
	if daysSinceDiscovery < 7 && repo.Stars > 1000 {
		log.Printf("⚠️ Suspicious: repo %d is %d days old with %d stars", repoID, int(daysSinceDiscovery), repo.Stars)
		return true
	}

	return false
}

// FilterFalsePositives removes repos that are likely false positive "trends".
func FilterFalsePositives(repoID int64, database *db.Database) bool {
	// Check: single-day viral spike without sustained growth
	var velocityCount int
	database.Get(&velocityCount, `
		SELECT COUNT(*) FROM snapshots
		WHERE repo_id = ? AND star_velocity > 0 AND date >= date('now', '-7 days')
	`, repoID)

	// If only 1 day of growth in the last 7 days, it's a spike not a trend
	if velocityCount <= 1 {
		return true
	}

	return false
}

// FlagRepo marks a repo as suspicious in the database.
func FlagRepo(repoID int64, database *db.Database) {
	database.Exec(`UPDATE repos SET flag = 'suspicious' WHERE id = ?`, repoID)
}
