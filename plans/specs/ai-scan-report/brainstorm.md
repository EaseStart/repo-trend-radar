# AI Scan Report — Brainstorm

## Press Release

**Repo Trend Radar now delivers an AI-generated intelligence brief after every scan.**

Instead of scanning raw numbers, engineers get a concise report: what's new, what's trending, what moved zones, and what patterns are emerging. Think of it as a daily tech scout newsletter — automatically generated from your tracking data.

---

## 🧠 PM Perspective: The Problem

### What the user does today:
1. Open dashboard → see 460 repos, 50 topics, numbers
2. **Manually scan** cards, tables, charts trying to spot changes
3. **No way to know** what changed since the last scan
4. **No narrative** — just raw data. "442 rising" means nothing without context

### Root problem (First Principles):
> **Data ≠ Insight.** The dashboard shows *state* but not *change*. The user needs a **delta-focused narrative** that answers: "What should I pay attention to today?"

### Who benefits:
- **Solo tech scout** (primary) — saves 15-30 min of manual scanning
- **Team leads** — can forward the report as a daily tech brief

---

## Research Protocol

| Step | Finding |
|------|---------|
| **① Benchmark** | GitHub Trending (shows daily movers but no analysis). Product Hunt daily digest (curated narrative). Arc's "Browse for Me" (AI summarizes what matters). Perplexity's discover feed. Morning Brew newsletter format. |
| **② First Principles** | Problem is **Change Detection + Narrative Generation**. User doesn't need another dashboard — they need a **brief**. A brief answers: What? So what? Now what? |
| **③ Framework** | **Situation-Complication-Resolution (SCR)** from McKinsey: Situation (scan context) → Complication (what changed/matters) → Resolution (what to watch). |
| **④ Cross-Domain** | Financial markets: daily market summary. "S&P up 0.3%, led by tech. Nvidia +4% on earnings beat." Same pattern: aggregate → highlight movers → give context. |
| **⑤ Trade-offs** | **AI API dependency** — need Gemini/OpenAI key. Alternative: template-based (no AI needed, deterministic, but less insightful). **Decision:** Start with template-based + optional AI enhancement. |
| **⑥ Executability** | All data available in JSON. Template-based = pure Go (scanner already in Go). AI-enhanced = add API call in CI pipeline. Both produce `report.json` consumed by dashboard. |

---

## User Stories

| # | As a... | I want to... | So that... |
|---|---------|-------------|-----------|
| S1 | Tech scout | See a short summary after each scan | I know what changed without digging into numbers |
| S2 | Tech scout | Know which repos moved zones | I spot emerging projects early |
| S3 | Engineer | See new repos discovered this scan | I don't miss fresh additions |
| S4 | Analyst | Understand trending topics/languages | I track technology momentum |
| S5 | Team lead | Copy/share the report text | I can brief my team in Slack |

---

## MoSCoW

| Priority | Items |
|----------|-------|
| **P0 Must** | Scan summary card on dashboard, delta from previous scan (new repos, zone changes), top movers, template-based generation |
| **P1 Should** | AI-enhanced narrative (Gemini API), trending topics section, share/copy button |
| **P2 Could** | Historical reports (scroll through past briefs), email/Slack delivery |
| **Won't** | Real-time alerts, push notifications, predictive analytics |

---

## Report Content Structure (PM-defined)

### The Brief (what the AI generates)

```
📊 SCAN REPORT — Mar 20, 2026

OVERVIEW
"Tracked 460 repos. 12 new discoveries. 3 zone upgrades. 
AI agents and RAG remain dominant themes."

🆕 NEW DISCOVERIES (12)
- owner/repo-name — "description" (Python, ⭐ 342)
- owner/another — "description" (Rust, ⭐ 128)
...

🔄 ZONE CHANGES (3)  
- ⬆ owner/repo: seedling → rising (⭐ 800 → 1,200)
- ⬆ owner/repo: rising → breakout (⭐ 3,400 → 5,500)

🔥 TOP MOVERS (fastest star growth this scan)
- owner/repo: +340 stars (⭐ 2,100 total)
- owner/repo: +210 stars (⭐ 890 total)

📈 TRENDING SIGNALS
- "RAG" repos: 132 tracked, 129 rising
- "AI Agent" surpassed "Rust" as #2 topic
- TypeScript remains dominant language (38%)

💡 AI INSIGHT (optional, needs API key)
"Three new local-first database projects appeared this 
week, signaling growing interest in offline-capable 
AI applications..."
```

### Data Flow

```
scan.yml
  └── radar scan
      └── [NEW] radar report  ← generates report.json
          ├── Compare current vs previous scan data
          ├── Detect: new repos, zone changes, top movers
          ├── Calculate: topic trends, language shifts
          └── (Optional) Call Gemini API for narrative
  └── Commit data/ + dashboard/public/data/
  └── Build dashboard (reads report.json)
```

---

## Appetite & No-Gos

- **Time budget:** 1 session for template-based, +1 for AI enhancement
- **No-Gos:**
  - ❌ No real-time streaming — batch only (post-scan)
  - ❌ No storing report history (v1) — just latest report
  - ❌ No custom report templates — one format
  - ❌ No multi-model support — Gemini only (if AI used)

---

## Implementation Options

### Option A: Template-Based (No AI dependency)
- Pure Go in scanner: compare current vs previous `repos.json`
- Generate deterministic `report.json` with sections
- Dashboard renders it as a card
- **Pro:** No API key needed, deterministic, fast
- **Con:** No narrative insight, just structured data

### Option B: AI-Enhanced (Gemini API) 
- Same as A, but pass the structured diff to Gemini
- Gemini generates the narrative + insight section
- **Pro:** Rich, readable, insightful
- **Con:** API key required, latency, cost (~$0.01/scan)

### Recommendation: **Start with Option A, add B as enhancement**

The template-based report already covers 80% of the value. AI narrative is the cherry on top — easy to add later without changing the data pipeline.
