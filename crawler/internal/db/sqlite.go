package db

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	"github.com/jmoiron/sqlx"
	_ "github.com/mattn/go-sqlite3"
)

const schema = `
CREATE TABLE IF NOT EXISTS repos (
    id              INTEGER PRIMARY KEY,
    full_name       TEXT NOT NULL UNIQUE,
    description     TEXT,
    language        TEXT,
    topics          TEXT DEFAULT '[]',
    zone            TEXT NOT NULL DEFAULT 'seedling',
    stars           INTEGER DEFAULT 0,
    forks           INTEGER DEFAULT 0,
    open_issues     INTEGER DEFAULT 0,
    watchers        INTEGER DEFAULT 0,
    contributors    INTEGER DEFAULT 0,
    created_at      TEXT,
    pushed_at       TEXT,
    discovered_at   TEXT NOT NULL,
    graduated_at    TEXT,
    last_scanned_at TEXT,
    last_etag       TEXT,
    readme_sha      TEXT,
    heat_score      REAL DEFAULT 0,
    flag            TEXT
);

CREATE INDEX IF NOT EXISTS idx_repos_zone ON repos(zone);
CREATE INDEX IF NOT EXISTS idx_repos_heat ON repos(heat_score DESC);
CREATE INDEX IF NOT EXISTS idx_repos_stars ON repos(stars);

CREATE TABLE IF NOT EXISTS snapshots (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    repo_id         INTEGER NOT NULL REFERENCES repos(id),
    date            TEXT NOT NULL,
    stars           INTEGER,
    forks           INTEGER,
    open_issues     INTEGER,
    watchers        INTEGER,
    contributors    INTEGER,
    star_velocity   INTEGER DEFAULT 0,
    fork_velocity   INTEGER DEFAULT 0,
    issue_velocity  INTEGER DEFAULT 0,
    UNIQUE(repo_id, date)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_repo_date ON snapshots(repo_id, date DESC);

CREATE TABLE IF NOT EXISTS traction_signals (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    repo_id            INTEGER NOT NULL REFERENCES repos(id),
    scanned_at         TEXT NOT NULL,
    has_star_chart     INTEGER DEFAULT 0,
    has_used_by        INTEGER DEFAULT 0,
    has_download_count INTEGER DEFAULT 0,
    has_growth_chart   INTEGER DEFAULT 0,
    has_company_logos  INTEGER DEFAULT 0,
    badges             TEXT DEFAULT '[]',
    raw_signals        TEXT DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_traction_repo ON traction_signals(repo_id);

CREATE TABLE IF NOT EXISTS cluster_alerts (
    id                     INTEGER PRIMARY KEY AUTOINCREMENT,
    topic                  TEXT NOT NULL,
    detected_at            TEXT NOT NULL,
    growing_count          INTEGER,
    total_count            INTEGER,
    coverage_pct           REAL,
    confidence             REAL,
    avg_velocity           REAL,
    graduated_correlation  INTEGER DEFAULT 0,
    growing_repos          TEXT DEFAULT '[]',
    status                 TEXT DEFAULT 'active'
);

CREATE INDEX IF NOT EXISTS idx_alerts_topic ON cluster_alerts(topic, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_confidence ON cluster_alerts(confidence DESC);

CREATE TABLE IF NOT EXISTS seed_topics (
    topic           TEXT PRIMARY KEY,
    source          TEXT DEFAULT 'manual',
    added_at        TEXT NOT NULL,
    last_scanned_at TEXT,
    repo_count      INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS scan_log (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at      TEXT NOT NULL,
    finished_at     TEXT,
    phase           TEXT,
    repos_scanned   INTEGER DEFAULT 0,
    api_calls_used  INTEGER DEFAULT 0,
    errors          INTEGER DEFAULT 0,
    notes           TEXT
);
`

// Database wraps sqlx.DB with project-specific helpers.
type Database struct {
	*sqlx.DB
}

// Open opens (or creates) the SQLite database and runs migrations.
func Open(dbPath string) (*Database, error) {
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, fmt.Errorf("create db directory: %w", err)
	}

	db, err := sqlx.Open("sqlite3", dbPath+"?_journal_mode=WAL&_busy_timeout=5000")
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("ping database: %w", err)
	}

	if _, err := db.Exec(schema); err != nil {
		return nil, fmt.Errorf("run migrations: %w", err)
	}

	return &Database{DB: db}, nil
}

// SeedTopics inserts initial seed topics if they don't exist.
func (d *Database) SeedTopics(topics []string) error {
	tx, err := d.Beginx()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare(`INSERT OR IGNORE INTO seed_topics (topic, source, added_at) VALUES (?, 'manual', datetime('now'))`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, topic := range topics {
		if _, err := stmt.Exec(topic); err != nil {
			return err
		}
	}
	return tx.Commit()
}

// UpsertRepo inserts or updates a repo record.
func (d *Database) UpsertRepo(r *Repo) error {
	_, err := d.NamedExec(`
		INSERT INTO repos (id, full_name, description, language, topics, zone, stars, forks, open_issues, watchers, discovered_at)
		VALUES (:id, :full_name, :description, :language, :topics, :zone, :stars, :forks, :open_issues, :watchers, :discovered_at)
		ON CONFLICT(id) DO UPDATE SET
			description = excluded.description,
			language = excluded.language,
			topics = excluded.topics,
			stars = excluded.stars,
			forks = excluded.forks,
			open_issues = excluded.open_issues,
			watchers = excluded.watchers,
			pushed_at = excluded.pushed_at,
			last_scanned_at = datetime('now')
	`, r)
	return err
}

// InsertSnapshot records a daily snapshot and velocity.
func (d *Database) InsertSnapshot(s *Snapshot) error {
	// Get previous snapshot for velocity calc
	var prev Snapshot
	err := d.Get(&prev, `SELECT stars, forks, open_issues FROM snapshots WHERE repo_id = ? ORDER BY date DESC LIMIT 1`, s.RepoID)
	if err == nil {
		s.StarVelocity = s.Stars - prev.Stars
		s.ForkVelocity = s.Forks - prev.Forks
		s.IssueVelocity = s.OpenIssues - prev.OpenIssues
	} else if err != sql.ErrNoRows {
		return err
	}

	_, err = d.NamedExec(`
		INSERT OR REPLACE INTO snapshots (repo_id, date, stars, forks, open_issues, watchers, contributors, star_velocity, fork_velocity, issue_velocity)
		VALUES (:repo_id, :date, :stars, :forks, :open_issues, :watchers, :contributors, :star_velocity, :fork_velocity, :issue_velocity)
	`, s)
	return err
}

// ReposByZone returns repos filtered by zone.
func (d *Database) ReposByZone(zone string) ([]Repo, error) {
	var repos []Repo
	err := d.Select(&repos, `SELECT * FROM repos WHERE zone = ? ORDER BY heat_score DESC`, zone)
	return repos, err
}

// UpdateZone transitions a repo to a new zone.
func (d *Database) UpdateZone(repoID int64, zone string) error {
	q := `UPDATE repos SET zone = ?, last_scanned_at = datetime('now') WHERE id = ?`
	if zone == "graduated" {
		q = `UPDATE repos SET zone = ?, graduated_at = datetime('now'), last_scanned_at = datetime('now') WHERE id = ?`
	}
	_, err := d.Exec(q, zone, repoID)
	return err
}

// UpdateHeatScore updates the heat score for a repo.
func (d *Database) UpdateHeatScore(repoID int64, score float64) error {
	_, err := d.Exec(`UPDATE repos SET heat_score = ? WHERE id = ?`, score, repoID)
	return err
}

// ActiveClusterAlerts returns non-expired cluster alerts.
func (d *Database) ActiveClusterAlerts() ([]ClusterAlert, error) {
	var alerts []ClusterAlert
	err := d.Select(&alerts, `SELECT * FROM cluster_alerts WHERE status = 'active' ORDER BY confidence DESC`)
	return alerts, err
}

// InsertClusterAlert stores a new cluster alert.
func (d *Database) InsertClusterAlert(a *ClusterAlert) error {
	_, err := d.NamedExec(`
		INSERT INTO cluster_alerts (topic, detected_at, growing_count, total_count, coverage_pct, confidence, avg_velocity, graduated_correlation, growing_repos, status)
		VALUES (:topic, :detected_at, :growing_count, :total_count, :coverage_pct, :confidence, :avg_velocity, :graduated_correlation, :growing_repos, :status)
	`, a)
	return err
}

// Stats returns aggregate database statistics.
func (d *Database) Stats() (*DBStats, error) {
	s := &DBStats{}
	d.Get(&s.TotalTracked, `SELECT COUNT(*) FROM repos`)
	d.Get(&s.SeedlingCount, `SELECT COUNT(*) FROM repos WHERE zone = 'seedling'`)
	d.Get(&s.RisingCount, `SELECT COUNT(*) FROM repos WHERE zone = 'rising'`)
	d.Get(&s.BreakoutCount, `SELECT COUNT(*) FROM repos WHERE zone = 'breakout'`)
	d.Get(&s.GraduatedCount, `SELECT COUNT(*) FROM repos WHERE zone = 'graduated'`)
	d.Get(&s.ActiveClusters, `SELECT COUNT(*) FROM cluster_alerts WHERE status = 'active'`)
	d.Get(&s.LastScanAt, `SELECT COALESCE(MAX(finished_at), '') FROM scan_log`)
	return s, nil
}

// DBStats holds aggregate counts.
type DBStats struct {
	TotalTracked   int    `json:"totalTracked"`
	SeedlingCount  int    `json:"seedlingCount"`
	RisingCount    int    `json:"risingCount"`
	BreakoutCount  int    `json:"breakoutCount"`
	GraduatedCount int    `json:"graduatedCount"`
	ActiveClusters int    `json:"activeClusters"`
	LastScanAt     string `json:"lastScanAt"`
}
