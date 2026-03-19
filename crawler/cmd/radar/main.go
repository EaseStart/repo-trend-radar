package main

import (
	"fmt"
	"log"
	"os"

	"github.com/easestart/repo-trend-radar/crawler/internal/cluster"
	"github.com/easestart/repo-trend-radar/crawler/internal/db"
	"github.com/easestart/repo-trend-radar/crawler/internal/export"
	"github.com/easestart/repo-trend-radar/crawler/internal/github"
	"github.com/easestart/repo-trend-radar/crawler/internal/scanner"
	"github.com/spf13/cobra"
)

func main() {
	root := &cobra.Command{
		Use:   "radar",
		Short: "Repo Trend Radar — detect emerging open-source ecosystems",
	}

	root.AddCommand(
		scanCmd(),
		exploreCmd(),
		trackCmd(),
		analyzeCmd(),
		detectCmd(),
		exportCmd(),
		statsCmd(),
	)

	if err := root.Execute(); err != nil {
		os.Exit(1)
	}
}

func getDB() *db.Database {
	dbPath := envOr("RADAR_DB_PATH", "./data/radar.db")
	database, err := db.Open(dbPath)
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}
	return database
}

func getClient() *github.Client {
	token := os.Getenv("GITHUB_TOKEN")
	if token == "" {
		log.Fatal("GITHUB_TOKEN environment variable is required")
	}
	return github.NewClient(token)
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// scanCmd runs the full daily pipeline.
func scanCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "scan",
		Short: "Run full daily scan pipeline",
		RunE: func(cmd *cobra.Command, args []string) error {
			database := getDB()
			defer database.Close()
			client := getClient()

			// Seed topics on first run
			if err := database.SeedTopics(db.DefaultSeedTopics()); err != nil {
				log.Printf("Warning: seed topics failed: %v", err)
			}

			// Phase 1: Explorer
			fmt.Println("🔍 Phase 1: Explorer — discovering new repos...")
			exp := scanner.NewExplorer(client, database)
			discovered, err := exp.Discover(cmd.Context())
			if err != nil {
				log.Printf("Explorer error: %v", err)
			}
			fmt.Printf("   Discovered %d new repos\n", discovered)

			// Phase 2: Tracker
			fmt.Println("📊 Phase 2: Tracker — scanning rising repos...")
			trk := scanner.NewTracker(client, database)
			if err := trk.ScanRising(cmd.Context()); err != nil {
				log.Printf("Tracker rising error: %v", err)
			}

			fmt.Println("🌱 Phase 2b: Tracker — scanning seedling repos...")
			if err := trk.ScanSeedling(cmd.Context()); err != nil {
				log.Printf("Tracker seedling error: %v", err)
			}

			// Phase 3: Zone transitions
			fmt.Println("⬆️ Phase 3: Zone transitions...")
			promoted, err := trk.Promote(cmd.Context())
			if err != nil {
				log.Printf("Promote error: %v", err)
			}
			fmt.Printf("   Promoted %d repos to rising\n", len(promoted))

			graduated, err := trk.Graduate(cmd.Context())
			if err != nil {
				log.Printf("Graduate error: %v", err)
			}
			fmt.Printf("   Graduated %d repos\n", len(graduated))

			// Phase 4: Deep analysis
			fmt.Println("🔬 Phase 4: Deep analysis on hot repos...")
			deep := scanner.NewDeepAnalyzer(client, database)
			if err := deep.Analyze(cmd.Context()); err != nil {
				log.Printf("Deep analysis error: %v", err)
			}

			// Phase 5: Cluster detection
			fmt.Println("🎯 Phase 5: Cluster detection...")
			alerts, err := cluster.Detect(database)
			if err != nil {
				log.Printf("Cluster detection error: %v", err)
			}
			fmt.Printf("   Detected %d cluster alerts\n", len(alerts))

			// Phase 6: Export
			fmt.Println("📦 Phase 6: Exporting JSON for dashboard...")
			if err := export.GenerateAll(database, "./dashboard/public/data"); err != nil {
				log.Printf("Export error: %v", err)
			}

			fmt.Println("✅ Scan complete!")
			return nil
		},
	}
}

func exploreCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "explore",
		Short: "Run Explorer crawler only",
		RunE: func(cmd *cobra.Command, args []string) error {
			database := getDB()
			defer database.Close()
			client := getClient()

			if err := database.SeedTopics(db.DefaultSeedTopics()); err != nil {
				log.Printf("Warning: seed topics failed: %v", err)
			}

			exp := scanner.NewExplorer(client, database)
			discovered, err := exp.Discover(cmd.Context())
			fmt.Printf("Discovered %d new repos\n", discovered)
			return err
		},
	}
}

func trackCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "track",
		Short: "Run Tracker scanner (rising + seedling)",
		RunE: func(cmd *cobra.Command, args []string) error {
			database := getDB()
			defer database.Close()
			client := getClient()

			trk := scanner.NewTracker(client, database)
			if err := trk.ScanRising(cmd.Context()); err != nil {
				return err
			}
			return trk.ScanSeedling(cmd.Context())
		},
	}
}

func analyzeCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "analyze",
		Short: "Run deep analysis on hot repos",
		RunE: func(cmd *cobra.Command, args []string) error {
			database := getDB()
			defer database.Close()
			client := getClient()

			deep := scanner.NewDeepAnalyzer(client, database)
			return deep.Analyze(cmd.Context())
		},
	}
}

func detectCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "detect",
		Short: "Run cluster detection",
		RunE: func(cmd *cobra.Command, args []string) error {
			database := getDB()
			defer database.Close()

			alerts, err := cluster.Detect(database)
			if err != nil {
				return err
			}
			fmt.Printf("Detected %d cluster alerts\n", len(alerts))
			for _, a := range alerts {
				fmt.Printf("  🔥 %s — confidence: %.0f%% (%d/%d repos growing)\n",
					a.Topic, a.Confidence*100, a.GrowingCount, a.TotalCount)
			}
			return nil
		},
	}
}

func exportCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "export",
		Short: "Export SQLite data to JSON for dashboard",
		RunE: func(cmd *cobra.Command, args []string) error {
			database := getDB()
			defer database.Close()
			return export.GenerateAll(database, "./dashboard/public/data")
		},
	}
}

func statsCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "stats",
		Short: "Print database statistics",
		RunE: func(cmd *cobra.Command, args []string) error {
			database := getDB()
			defer database.Close()

			stats, err := database.Stats()
			if err != nil {
				return err
			}

			fmt.Printf("📡 Repo Trend Radar Stats\n")
			fmt.Printf("━━━━━━━━━━━━━━━━━━━━━━━━\n")
			fmt.Printf("Total tracked:  %d\n", stats.TotalTracked)
			fmt.Printf("  🌱 Seedling:  %d\n", stats.SeedlingCount)
			fmt.Printf("  📈 Rising:    %d\n", stats.RisingCount)
			fmt.Printf("  🔥 Breakout:  %d\n", stats.BreakoutCount)
			fmt.Printf("  🏛️ Graduated: %d\n", stats.GraduatedCount)
			fmt.Printf("Active clusters: %d\n", stats.ActiveClusters)
			fmt.Printf("Last scan:       %s\n", stats.LastScanAt)
			return nil
		},
	}
}
