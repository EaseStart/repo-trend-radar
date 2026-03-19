package db

import "time"

// Repo represents a tracked GitHub repository.
type Repo struct {
	ID            int64      `db:"id" json:"id"`
	FullName      string     `db:"full_name" json:"fullName"`
	Description   *string    `db:"description" json:"description"`
	Language      *string    `db:"language" json:"language"`
	Topics        string     `db:"topics" json:"topics"` // JSON array string
	Zone          string     `db:"zone" json:"zone"`
	Stars         int        `db:"stars" json:"stars"`
	Forks         int        `db:"forks" json:"forks"`
	OpenIssues    int        `db:"open_issues" json:"openIssues"`
	Watchers      int        `db:"watchers" json:"watchers"`
	Contributors  int        `db:"contributors" json:"contributors"`
	CreatedAt     *string    `db:"created_at" json:"createdAt"`
	PushedAt      *string    `db:"pushed_at" json:"pushedAt"`
	DiscoveredAt  string     `db:"discovered_at" json:"discoveredAt"`
	GraduatedAt   *string    `db:"graduated_at" json:"graduatedAt"`
	LastScannedAt *string    `db:"last_scanned_at" json:"lastScannedAt"`
	LastEtag      *string    `db:"last_etag" json:"-"`
	ReadmeSHA     *string    `db:"readme_sha" json:"-"`
	HeatScore     float64    `db:"heat_score" json:"heatScore"`
	Flag          *string    `db:"flag" json:"flag"`
}

// Snapshot represents a daily metrics snapshot for a repo.
type Snapshot struct {
	ID            int64  `db:"id" json:"-"`
	RepoID        int64  `db:"repo_id" json:"repoId"`
	Date          string `db:"date" json:"date"`
	Stars         int    `db:"stars" json:"stars"`
	Forks         int    `db:"forks" json:"forks"`
	OpenIssues    int    `db:"open_issues" json:"openIssues"`
	Watchers      int    `db:"watchers" json:"watchers"`
	Contributors  int    `db:"contributors" json:"contributors"`
	StarVelocity  int    `db:"star_velocity" json:"starVelocity"`
	ForkVelocity  int    `db:"fork_velocity" json:"forkVelocity"`
	IssueVelocity int    `db:"issue_velocity" json:"issueVelocity"`
}

// TractionSignal represents README traction analysis results.
type TractionSignal struct {
	ID               int64  `db:"id" json:"-"`
	RepoID           int64  `db:"repo_id" json:"repoId"`
	ScannedAt        string `db:"scanned_at" json:"scannedAt"`
	HasStarChart     bool   `db:"has_star_chart" json:"hasStarChart"`
	HasUsedBy        bool   `db:"has_used_by" json:"hasUsedBy"`
	HasDownloadCount bool   `db:"has_download_count" json:"hasDownloadCount"`
	HasGrowthChart   bool   `db:"has_growth_chart" json:"hasGrowthChart"`
	HasCompanyLogos  bool   `db:"has_company_logos" json:"hasCompanyLogos"`
	Badges           string `db:"badges" json:"badges"`       // JSON array
	RawSignals       string `db:"raw_signals" json:"rawSignals"` // JSON object
}

// ClusterAlert represents a detected trend cluster.
type ClusterAlert struct {
	ID                   int64   `db:"id" json:"id"`
	Topic                string  `db:"topic" json:"topic"`
	DetectedAt           string  `db:"detected_at" json:"detectedAt"`
	GrowingCount         int     `db:"growing_count" json:"growingCount"`
	TotalCount           int     `db:"total_count" json:"totalCount"`
	CoveragePct          float64 `db:"coverage_pct" json:"coveragePct"`
	Confidence           float64 `db:"confidence" json:"confidence"`
	AvgVelocity          float64 `db:"avg_velocity" json:"avgVelocity"`
	GraduatedCorrelation int     `db:"graduated_correlation" json:"graduatedCorrelation"`
	GrowingRepos         string  `db:"growing_repos" json:"growingRepos"` // JSON array
	Status               string  `db:"status" json:"status"`
}

// SeedTopic represents a topic used for discovery.
type SeedTopic struct {
	Topic         string  `db:"topic" json:"topic"`
	Source        string  `db:"source" json:"source"`
	AddedAt       string  `db:"added_at" json:"addedAt"`
	LastScannedAt *string `db:"last_scanned_at" json:"lastScannedAt"`
	RepoCount     int     `db:"repo_count" json:"repoCount"`
}

// ScanLog records a scan execution.
type ScanLog struct {
	ID           int64   `db:"id" json:"id"`
	StartedAt    string  `db:"started_at" json:"startedAt"`
	FinishedAt   *string `db:"finished_at" json:"finishedAt"`
	Phase        string  `db:"phase" json:"phase"`
	ReposScanned int     `db:"repos_scanned" json:"reposScanned"`
	APICallsUsed int     `db:"api_calls_used" json:"apiCallsUsed"`
	Errors       int     `db:"errors" json:"errors"`
	Notes        *string `db:"notes" json:"notes"`
}

// RepoVelocity is used in cluster alert growing_repos JSON.
type RepoVelocity struct {
	FullName       string  `json:"full_name"`
	Stars          int     `json:"stars"`
	StarVelocity7d int     `json:"star_velocity_7d"`
	GrowthPct      float64 `json:"growth_pct"`
}

// DefaultSeedTopics returns the initial topic list.
func DefaultSeedTopics() []string {
	return []string{
		"llm", "ai-agent", "vector-database", "rag",
		"rust", "zig", "local-first", "webassembly",
		"edge-computing", "htmx", "bun", "deno",
		"ai-coding", "mcp", "opentelemetry",
		"sqlite", "turso", "drizzle-orm",
		"shadcn-ui", "tailwindcss",
	}
}

// Now returns current time as ISO string.
func Now() string {
	return time.Now().UTC().Format(time.RFC3339)
}

// Today returns current date as YYYY-MM-DD.
func Today() string {
	return time.Now().UTC().Format("2006-01-02")
}
