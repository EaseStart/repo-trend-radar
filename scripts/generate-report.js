#!/usr/bin/env node
/**
 * generate-report.js
 * 
 * Compares current scan data with previous snapshot to produce report.json
 * 
 * Usage: node scripts/generate-report.js [--prev-dir <path>]
 * 
 * Reads from: dashboard/public/data/repos.json, stats.json, topics.json
 * Reads prev:  data/prev/repos.json (saved before scan)
 * Writes to:   dashboard/public/data/report.json
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'dashboard', 'public', 'data');
const PREV_DIR = process.argv.includes('--prev-dir')
  ? process.argv[process.argv.indexOf('--prev-dir') + 1]
  : path.join(__dirname, '..', 'data', 'prev');

function readJSON(filepath) {
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  } catch {
    return null;
  }
}

function generateReport() {
  const repos = readJSON(path.join(DATA_DIR, 'repos.json')) || [];
  const stats = readJSON(path.join(DATA_DIR, 'stats.json')) || {};
  const topics = readJSON(path.join(DATA_DIR, 'topics.json')) || [];
  const prevRepos = readJSON(path.join(PREV_DIR, 'repos.json'));

  const now = new Date().toISOString();
  const hasPrev = Array.isArray(prevRepos) && prevRepos.length > 0;

  // Build lookup maps
  const currentMap = new Map(repos.map(r => [r.fullName, r]));
  const prevMap = hasPrev ? new Map(prevRepos.map(r => [r.fullName, r])) : new Map();

  // --- NEW DISCOVERIES ---
  const newRepos = repos
    .filter(r => !prevMap.has(r.fullName))
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 10)
    .map(r => ({
      fullName: r.fullName,
      description: r.description,
      language: r.language,
      stars: r.stars,
      zone: r.zone,
    }));

  // --- ZONE CHANGES ---
  const zoneChanges = [];
  if (hasPrev) {
    for (const [name, curr] of currentMap) {
      const prev = prevMap.get(name);
      if (prev && prev.zone !== curr.zone) {
        zoneChanges.push({
          fullName: name,
          from: prev.zone,
          to: curr.zone,
          stars: curr.stars,
          prevStars: prev.stars,
        });
      }
    }
  }
  zoneChanges.sort((a, b) => b.stars - a.stars);

  // --- TOP MOVERS (biggest star gains) ---
  const movers = [];
  if (hasPrev) {
    for (const [name, curr] of currentMap) {
      const prev = prevMap.get(name);
      if (prev) {
        const gain = curr.stars - prev.stars;
        if (gain > 0) {
          movers.push({
            fullName: name,
            starGain: gain,
            stars: curr.stars,
            zone: curr.zone,
            language: curr.language,
          });
        }
      }
    }
    movers.sort((a, b) => b.starGain - a.starGain);
  }

  // --- TRENDING TOPICS ---
  const trendingTopics = topics
    .filter(t => t.repoCount > 0 || t.risingCount > 0)
    .sort((a, b) => (b.risingCount + b.breakoutCount) - (a.risingCount + a.breakoutCount))
    .slice(0, 8)
    .map(t => ({
      topic: t.topic,
      repoCount: t.repoCount,
      risingCount: t.risingCount,
      breakoutCount: t.breakoutCount,
      avgVelocity: t.avgVelocity,
    }));

  // --- LANGUAGE DISTRIBUTION ---
  const langCounts = {};
  for (const r of repos) {
    if (r.language) {
      langCounts[r.language] = (langCounts[r.language] || 0) + 1;
    }
  }
  const topLanguages = Object.entries(langCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([lang, count]) => ({ language: lang, count, pct: Math.round(count / repos.length * 100) }));

  // --- OVERVIEW ---
  const overview = {
    totalTracked: repos.length,
    prevTracked: hasPrev ? prevRepos.length : null,
    newCount: newRepos.length,
    zoneChangeCount: zoneChanges.length,
    topMoverCount: movers.length,
    breakoutCount: stats.breakoutCount || 0,
    risingCount: stats.risingCount || 0,
    seedlingCount: stats.seedlingCount || 0,
    scanAt: stats.lastScanAt || now,
  };

  // --- NARRATIVE (template-based) ---
  const parts = [];
  parts.push(`Tracked ${overview.totalTracked} repos.`);
  if (hasPrev) {
    if (newRepos.length > 0) parts.push(`${newRepos.length} new discoveries.`);
    if (zoneChanges.length > 0) parts.push(`${zoneChanges.length} zone upgrades.`);
    if (movers.length > 0) parts.push(`Top mover gained +${movers[0].starGain} stars.`);
  }
  if (trendingTopics.length > 0) {
    parts.push(`"${trendingTopics[0].topic}" leads with ${trendingTopics[0].risingCount} rising repos.`);
  }
  const narrative = parts.join(' ');

  // --- ASSEMBLE REPORT ---
  const report = {
    generatedAt: now,
    hasPreviousData: hasPrev,
    narrative,
    overview,
    newDiscoveries: newRepos,
    zoneChanges: zoneChanges.slice(0, 10),
    topMovers: movers.slice(0, 10),
    trendingTopics,
    topLanguages,
  };

  // Write
  const outPath = path.join(DATA_DIR, 'report.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`✅ Report generated: ${outPath}`);
  console.log(`   ${narrative}`);
}

generateReport();
