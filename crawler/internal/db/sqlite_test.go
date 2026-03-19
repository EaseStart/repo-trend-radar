package db

import (
	"fmt"
	"os"
	"path/filepath"
	"testing"
)

func strPtr(s string) *string { return &s }

func TestOpenAndMigrate(t *testing.T) {
	dir := t.TempDir()
	dbPath := filepath.Join(dir, "test.db")

	db, err := Open(dbPath)
	if err != nil {
		t.Fatalf("Open failed: %v", err)
	}
	defer db.Close()

	// Verify tables exist
	tables := []string{"repos", "snapshots", "traction_signals", "cluster_alerts", "seed_topics", "scan_log"}
	for _, table := range tables {
		var count int
		err := db.Get(&count, "SELECT COUNT(*) FROM "+table)
		if err != nil {
			t.Errorf("Table %s not found: %v", table, err)
		}
	}
}

func TestSeedTopics(t *testing.T) {
	dir := t.TempDir()
	db, err := Open(filepath.Join(dir, "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	topics := []string{"llm", "rag", "vector-database"}
	if err := db.SeedTopics(topics); err != nil {
		t.Fatalf("SeedTopics failed: %v", err)
	}

	// Verify seeds inserted
	var count int
	db.Get(&count, "SELECT COUNT(*) FROM seed_topics")
	if count != 3 {
		t.Errorf("Expected 3 seed topics, got %d", count)
	}

	// Verify idempotent (re-seeding doesn't duplicate)
	if err := db.SeedTopics(topics); err != nil {
		t.Fatalf("SeedTopics (idempotent) failed: %v", err)
	}
	db.Get(&count, "SELECT COUNT(*) FROM seed_topics")
	if count != 3 {
		t.Errorf("Expected 3 seed topics after re-seed, got %d", count)
	}
}

func TestUpsertAndQueryRepo(t *testing.T) {
	dir := t.TempDir()
	db, err := Open(filepath.Join(dir, "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	repo := &Repo{
		ID:           12345,
		FullName:     "test/repo",
		Description:  strPtr("A test repo"),
		Language:     strPtr("Go"),
		Topics:       `["testing", "go"]`,
		Zone:         "seedling",
		Stars:        50,
		Forks:        5,
		DiscoveredAt: Now(),
	}

	if err := db.UpsertRepo(repo); err != nil {
		t.Fatalf("UpsertRepo failed: %v", err)
	}

	// Verify
	repos, err := db.ReposByZone("seedling")
	if err != nil {
		t.Fatalf("ReposByZone failed: %v", err)
	}
	if len(repos) != 1 {
		t.Fatalf("Expected 1 repo, got %d", len(repos))
	}
	if repos[0].FullName != "test/repo" {
		t.Errorf("Expected full_name 'test/repo', got '%s'", repos[0].FullName)
	}
}

func TestZoneTransitions(t *testing.T) {
	dir := t.TempDir()
	db, err := Open(filepath.Join(dir, "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	repo := &Repo{
		ID:           999,
		FullName:     "test/zone-repo",
		Zone:         "seedling",
		Stars:        150,
		DiscoveredAt: Now(),
	}
	db.UpsertRepo(repo)

	// Promote to rising
	if err := db.UpdateZone(999, "rising"); err != nil {
		t.Fatal(err)
	}
	repos, _ := db.ReposByZone("rising")
	if len(repos) != 1 {
		t.Errorf("Expected 1 rising repo, got %d", len(repos))
	}

	// Graduate
	if err := db.UpdateZone(999, "graduated"); err != nil {
		t.Fatal(err)
	}
	repos, _ = db.ReposByZone("graduated")
	if len(repos) != 1 {
		t.Errorf("Expected 1 graduated repo, got %d", len(repos))
	}

	// Verify graduated_at is set
	if repos[0].GraduatedAt == nil {
		t.Error("Expected graduated_at to be set")
	}
}

func TestSnapshotWithVelocity(t *testing.T) {
	dir := t.TempDir()
	db, err := Open(filepath.Join(dir, "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	repo := &Repo{ID: 555, FullName: "test/snap", Zone: "rising", Stars: 100, DiscoveredAt: Now()}
	db.UpsertRepo(repo)

	// First snapshot — velocity should be 0
	s1 := &Snapshot{RepoID: 555, Date: "2026-03-18", Stars: 100, Forks: 10, OpenIssues: 5}
	if err := db.InsertSnapshot(s1); err != nil {
		t.Fatal(err)
	}

	// Second snapshot — velocity should be calculated
	s2 := &Snapshot{RepoID: 555, Date: "2026-03-19", Stars: 120, Forks: 12, OpenIssues: 8}
	if err := db.InsertSnapshot(s2); err != nil {
		t.Fatal(err)
	}

	// Verify velocity
	var snap Snapshot
	db.Get(&snap, "SELECT * FROM snapshots WHERE repo_id = 555 AND date = '2026-03-19'")
	if snap.StarVelocity != 20 {
		t.Errorf("Expected star_velocity = 20, got %d", snap.StarVelocity)
	}
	if snap.ForkVelocity != 2 {
		t.Errorf("Expected fork_velocity = 2, got %d", snap.ForkVelocity)
	}
}

func TestStats(t *testing.T) {
	dir := t.TempDir()
	db, err := Open(filepath.Join(dir, "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()

	// Add repos in different zones
	zones := []string{"seedling", "seedling", "rising", "breakout"}
	for i, zone := range zones {
		repo := &Repo{ID: int64(i + 1), FullName: fmt.Sprintf("test/%s-%d", zone, i), Zone: zone, DiscoveredAt: Now()}
		db.UpsertRepo(repo)
	}

	stats, err := db.Stats()
	if err != nil {
		t.Fatal(err)
	}

	if stats.TotalTracked != 4 {
		t.Errorf("Expected totalTracked = 4, got %d", stats.TotalTracked)
	}
	if stats.SeedlingCount != 2 {
		t.Errorf("Expected seedlingCount = 2, got %d", stats.SeedlingCount)
	}
	if stats.RisingCount != 1 {
		t.Errorf("Expected risingCount = 1, got %d", stats.RisingCount)
	}
	if stats.BreakoutCount != 1 {
		t.Errorf("Expected breakoutCount = 1, got %d", stats.BreakoutCount)
	}
}

// Suppress unused import
var _ = os.TempDir
