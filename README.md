<div align="center">
  <img src="dashboard/public/logo.png" alt="Repo Trend Radar Logo" width="120" />
  
  <h1>radar. 📡</h1>
  <p><strong>For builders tracking what's next in open source.</strong></p>

  <!-- Badges -->
  <a href="https://github.com/easestart/repo-trend-radar/stargazers"><img src="https://img.shields.io/github/stars/easestart/repo-trend-radar?style=for-the-badge&color=2F81F7" alt="Stars" /></a>
  <a href="https://github.com/easestart/repo-trend-radar/network/members"><img src="https://img.shields.io/github/forks/easestart/repo-trend-radar?style=for-the-badge&color=238636" alt="Forks" /></a>
  <a href="https://github.com/easestart/repo-trend-radar/blob/main/LICENSE"><img src="https://img.shields.io/github/license/easestart/repo-trend-radar?style=for-the-badge&color=8957E5" alt="License" /></a>
  <a href="https://github.com/easestart/repo-trend-radar/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/easestart/repo-trend-radar/ci.yml?style=for-the-badge&color=238636" alt="Build Status" /></a>

  <p>
    <a href="#-features">Features</a> •
    <a href="#-architecture">Architecture</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-the-zone-system">Zone System</a>
  </p>
</div>

<!-- Visual Separator -->
<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&height=2&customColorList=11,20" width="100%" alt="separator">

<br>

<p align="center">
  <em>Automated detection of emerging open-source technology ecosystems by analyzing GitHub repository growth patterns across topics.</em>
  <br>
  Catch trends at 50 stars, not 50,000.
</p>

<p align="center">
  <img src="docs/slides/carousel.gif" width="700" alt="Repo Trend Radar Preview" style="border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
</p>

<br>

## 🛠️ Stack

<p align="center">
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=go,sqlite,nextjs,react,tailwind,github&theme=light" alt="Tech Stack" />
  </a>
</p>

## ✨ Features

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>🔍 Discovery & Tracking</h3>
      <ul>
        <li><b>Auto-discover</b> new repos by rotating through seed topics</li>
        <li><b>Track star velocity</b> across life-cycle zones</li>
        <li><b>Detect trend clusters</b> (multiple repos growing simultaneously)</li>
        <li><b>Analyze README signals</b> (star charts, "used by" sections, badges)</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>📋 Output & UX</h3>
      <ul>
        <li><b>Interactive dashboard</b> with TikTok-style README browsing</li>
        <li><b>Score confidence</b> using multi-signal weighting</li>
        <li><b>Scan reports</b> — automated delta reports after each daily scan</li>
        <li><b>Deep-linkable filters</b> (/repos?zone=breakout&language=Rust)</li>
      </ul>
    </td>
  </tr>
</table>

## 🏗️ Architecture

```text
┌──────────────┐     ┌──────────┐     ┌──────────────┐
│  Go Crawler  │────▶│  SQLite  │────▶│  JSON Export  │
│  (daily cron)│     │  (WAL)   │     │  (5 files)    │
└──────────────┘     └──────────┘     └──────┬───────┘
                                             │
                                    ┌────────▼────────┐
                                    │  Next.js Static │
                                    │  (GitHub Pages) │
                                    └─────────────────┘
```

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/easestart/repo-trend-radar
cd repo-trend-radar

# Setup
cp .env.example .env
# Add your GITHUB_TOKEN to .env

# Build & Run Crawler
make build
make scan

# Preview dashboard
cd dashboard && npm install && npm run dev
```

<details>
<summary><b>🛠️ CLI Commands & Fork Configuration (Click to expand)</b></summary>
<br>

### Fork Configuration

After forking, edit `dashboard/site.config.ts` to customize:

```ts
const siteConfig = {
  githubRepo: 'your-username/repo-trend-radar',
  footer: {
    design:     { label: 'Your Studio', url: null },
    // ...
  },
};
```
Or simply set `NEXT_PUBLIC_GITHUB_REPO=your-username/repo-trend-radar` in `.env`.

### Available CLI Commands

| Command | Description |
|---------|-------------|
| `radar scan` | Full daily pipeline (all phases) |
| `radar explore` | Discover new repos from seed topics |
| `radar track` | Scan rising + seedling repos |
| `radar analyze` | Deep analysis on hot repos |
| `radar detect` | Run cluster detection |
| `radar export` | Generate JSON for dashboard |
| `radar stats` | Print database statistics |

</details>

## 🌍 The Zone System

| Zone | Stars | Scan Frequency | Description |
|------|-------|----------------|-------------|
| 🌱 **Seedling** | 1-99 | Every 3 days | Recently discovered, watching |
| 📈 **Rising** | 100-99,999 | Daily | Growing, tracking velocity |
| 🔥 **Breakout** | heat > 0.6 | Daily + deep | Rapid acceleration |
| 🏛️ **Graduated** | 10,000+ | Archived | Hall of fame, correlation data |

<br>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&height=2&customColorList=11,20" width="100%" alt="separator">

<p align="center">
  MIT © <a href="https://github.com/easestart">EaseStart</a><br>
  <sub>Design by <a href="https://easeui.design/">EaseUI</a> · Ideation by EaseStart · Developed by Jang, Lucius, Barry</sub>
</p>
