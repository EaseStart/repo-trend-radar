# All Repos View — Brainstorm

## Press Release

**Repo Trend Radar launches "All Repos" — explore 1,000+ tracked repositories with instant search, filters, and sorting.**

Engineers and tech scouts can now browse every tracked repository in a single view. Filter by zone, language, and star count. Search by name or description. Sort by stars, heat, or forks. Find exactly the repo you need in seconds — no more scrolling through dashboard cards.

## User Stories

| # | As a... | I want to... | So that... |
|---|---------|-------------|-----------|
| S1 | Tech scout | See all 1,134 repos in one paginated table | I get the full picture of what's tracked |
| S2 | Engineer | Search repos by name or description | I find specific repos I've heard about |
| S3 | Tech scout | Filter by zone (breakout/rising/seedling) | I focus on repos at the lifecycle stage I care about |
| S4 | Engineer | Filter by language (TypeScript, Rust, Go...) | I find repos in my tech stack |
| S5 | Analyst | Sort by stars, forks, or heat score | I rank repos by the metric that matters |
| S6 | Tech scout | See results update instantly (no page reload) | I can explore quickly without friction |
| S7 | User | Clear all filters with one click | I reset my exploration without reloading |

## MoSCoW

| Priority | Items |
|----------|-------|
| **P0 Must** | Search by name/description, zone filter, language filter, sort by stars/heat/forks, paginated table |
| **P1 Should** | Star-count range filter, URL query params (shareable filters), result count indicator |
| **P2 Could** | Topics filter chips, grid/list view toggle, export CSV |
| **Won't** | Real-time live data (static JSON), individual repo detail page, bookmarks |

## Appetite & No-Gos

- **Time budget:** 1 session (~2 hours)
- **No-Gos:**
  - ❌ No server-side filtering — all client-side (data is static JSON, ~1K rows = instant)
  - ❌ No complex multi-select dropdowns — use simple chip-based toggles
  - ❌ No infinite scroll — paginated table with clear page controls
  - ❌ No new data fetching logic — reuse existing `getRepos()` from `data.ts`

## Research Protocol

| Step | Finding |
|------|---------|
| **① Benchmark** | Linear's issue list: instant search, filter chips, column sorting. GitHub's explore: language filter pills, sort dropdown. npm search: type-ahead + badge filters. |
| **② First Principles** | Root problem: 1,134 items can't be scanned visually. Need **Reduce → Rank → Read** workflow. User must reduce the set (filters), rank by relevance (sort), then read (table). |
| **③ Framework** | **Information Foraging Theory** (Pirolli & Card) — users "scent" information. Strong scent = visible filter state + result count + highlighted matches. |
| **④ Cross-Domain** | E-commerce product listing pages: faceted navigation + active filter chips + "X results" count = proven pattern at scale (Amazon, Shopify). |
| **⑤ Trade-offs** | Client-side filtering (instant, no server) vs. server-side (scalable). At 1K rows, client-side wins. If repos grow to 10K+, revisit. |
| **⑥ Executability** | All data available in `repos.json`. Client component with `useState` hooks. No new dependencies needed — reuse existing Tailwind styles. |

---

# Use Cases (Phase 2)

## UC-01: Browse All Repos

**Actor:** Any user  
**Precondition:** `/repos` page loaded, `repos.json` available  
**Happy Path:**
1. User navigates to `/repos` via sidebar
2. Table shows first 25 repos sorted by stars (desc)
3. Each row shows: rank, fullName (linked), language, zone badge, stars, forks, heat score
4. Pagination at bottom: "Showing 1–25 of 1,134"

**Edge Cases:**
- Empty `repos.json` → show empty state
- Single page of results → hide pagination

**Acceptance:**
```gherkin
Given the repos page loads
When repos.json contains 1,134 repos
Then the table shows 25 rows with pagination showing "1–25 of 1,134"
```

## UC-02: Search Repos

**Actor:** Engineer  
**Precondition:** Repos loaded  
**Happy Path:**
1. User types in search input
2. Table filters in real-time (debounced 200ms)
3. Matches on `fullName` or `description` (case-insensitive)
4. Result count updates: "42 results"
5. Search term highlighted or result count visible

**Edge Cases:**
- No matches → "No repos match your search"
- Clear search → returns to full list

**Acceptance:**
```gherkin
Given the user types "turbo" in the search box
When the debounce fires
Then only repos with "turbo" in name or description are shown
And the result count updates
```

## UC-03: Filter by Zone

**Actor:** Tech scout  
**Precondition:** Repos loaded  
**Happy Path:**
1. Zone filter chips: All / Breakout / Rising / Seedling
2. Click "Breakout" → only breakout repos shown
3. Active chip is visually highlighted
4. Stacks with search and other filters

**Acceptance:**
```gherkin
Given the user clicks the "Breakout" zone chip
Then only repos with zone=breakout are shown
And the Breakout chip is highlighted
And the result count updates
```

## UC-04: Filter by Language

**Actor:** Engineer  
**Precondition:** Repos loaded  
**Happy Path:**
1. Language dropdown shows top 15 languages + "All"
2. Select "Rust" → only Rust repos shown
3. Stacks with zone filter and search

**Acceptance:**
```gherkin
Given the user selects "Rust" from the language filter
Then only repos with language=Rust are shown
And other active filters remain applied
```

## UC-05: Sort by Column

**Actor:** Analyst  
**Precondition:** Repos loaded  
**Happy Path:**
1. Click column header → sorts ascending
2. Click again → sorts descending
3. Arrow indicator shows sort direction
4. Sortable columns: Stars, Forks, Heat Score

**Acceptance:**
```gherkin
Given the user clicks the "Stars" column header
Then repos are sorted by stars descending
When the user clicks "Stars" again
Then repos are sorted by stars ascending
```

## UC-06: Clear All Filters

**Actor:** Any user  
**Precondition:** One or more filters active  
**Happy Path:**
1. "Clear all" button appears when any filter is active
2. Click → resets search, zone, language, sort to defaults
3. Full unfiltered list returns

## UC-07: Navigate via Sidebar

**Actor:** Any user  
**Happy Path:**
1. New "REPOS" nav item added to sidebar
2. Active state matches existing sidebar styling
3. Icon: `List` from lucide-react

---

## UX Decisions

| Decision | UX Law | Rationale |
|----------|--------|-----------|
| 25 rows per page | Miller's Law (7±2 chunks → groups of 25) | Manageable scan-length without overwhelming |
| Zone chips (not dropdown) | Hick's Law | 4 options → chips are faster than dropdown menus |
| Language as dropdown | Hick's Law | 39 options → too many for chips, dropdown reduces choice burden |
| Debounced search (200ms) | Doherty Threshold (<400ms) | Feels instant without thrashing on every keystroke |
| Sort indicator arrows | Jakob's Law | Users expect clickable headers from spreadsheet/table conventions |
| Sticky filter bar | Fitts' Law | Keeps controls at reachable distance while scrolling |

## Appetite Check

| UC | Effort | Value | Ship? |
|----|--------|-------|-------|
| UC-01 Browse | Low | High | ✅ |
| UC-02 Search | Low | High | ✅ |
| UC-03 Zone filter | Low | High | ✅ |
| UC-04 Language filter | Low | Medium | ✅ |
| UC-05 Sort | Low | High | ✅ |
| UC-06 Clear all | Low | Medium | ✅ |
| UC-07 Sidebar nav | Low | High | ✅ |
