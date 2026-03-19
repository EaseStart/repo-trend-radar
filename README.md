# 📡 Repo Trend Radar

Automated detection of emerging open-source technology ecosystems by analyzing GitHub repository growth patterns across topics.

## What It Does

1. **Discovers** new repos by rotating through seed topics and organic expansion
2. **Tracks** star velocity across zones: Seedling → Rising → Breakout → Graduated
3. **Detects** trend clusters — topics where multiple repos grow simultaneously
4. **Analyzes** README signals (star charts, "used by" sections, download badges)
5. **Scores** confidence using multi-signal weighting + graduated correlation

## Architecture

```
┌──────────────┐     ┌──────────┐     ┌──────────────┐
│  Go Crawler  │────▶│  SQLite  │────▶│  JSON Export  │
│  (daily cron)│     │  (WAL)   │     │  (5 files)    │
└──────────────┘     └──────────┘     └──────┬───────┘
                                             │
                                    ┌────────▼────────┐
                                    │  Next.js Static  │
                                    │  (GitHub Pages)  │
                                    └─────────────────┘
```

## Quick Start

```bash
# Clone
git clone https://github.com/easestart/repo-trend-radar
cd repo-trend-radar

# Setup
cp .env.example .env
# Add your GITHUB_TOKEN to .env

# Build
make build

# Run full scan
make scan

# Preview dashboard
make dev
```

## Project Structure

```
repo-trend-radar/
├── crawler/              # Go 1.23 module
│   ├── cmd/radar/        # CLI entry (cobra)
│   └── internal/         # Core packages
│       ├── db/           # SQLite + models
│       ├── github/       # REST + GraphQL client
│       ├── scanner/      # Explorer + Tracker + Deep
│       ├── readme/       # Traction signal mining
│       ├── cluster/      # Detection + confidence scoring
│       ├── antigaming/   # Bot detection
│       └── export/       # JSON generator
├── dashboard/            # Next.js 15 (static export)
│   ├── app/              # Pages
│   ├── components/       # React components
│   └── public/data/      # Generated JSON files
├── data/                 # SQLite database (gitignored)
└── .github/workflows/    # CI/CD
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `radar scan` | Full daily pipeline (all phases) |
| `radar explore` | Discover new repos from seed topics |
| `radar track` | Scan rising + seedling repos |
| `radar analyze` | Deep analysis on hot repos |
| `radar detect` | Run cluster detection |
| `radar export` | Generate JSON for dashboard |
| `radar stats` | Print database statistics |

## Zone System

| Zone | Stars | Scan Frequency | Description |
|------|-------|----------------|-------------|
| 🌱 Seedling | 1-99 | Every 3 days | Recently discovered, watching |
| 📈 Rising | 100-9999 | Daily | Growing, tracking velocity |
| 🔥 Breakout | heat > 0.6 | Daily + deep | Rapid acceleration |
| 🏛️ Graduated | 10,000+ | Archived | Hall of fame, correlation data |

## License

MIT © [EaseStart](https://github.com/easestart)
