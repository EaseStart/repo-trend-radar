'use client';

import { useDrawer } from './DrawerProvider';
import type { ScanReport } from '@/lib/data';
import { FileText, Sparkles, ArrowUpRight, TrendingUp, Star, Layers, Code } from 'lucide-react';

const ZONE_EMOJI: Record<string, string> = {
  seedling: '🌱',
  rising: '📈',
  breakout: '🔥',
  graduated: '🏛️',
};

const ZONE_COLORS: Record<string, string> = {
  breakout: 'text-[#F59E0B]',
  rising: 'text-[#007AFF]',
  seedling: 'text-slate-500',
  graduated: 'text-[#22C55E]',
};

export default function ScanReportCard({ report }: { report: ScanReport }) {
  const { openDrawer } = useDrawer();
  const { overview, narrative, newDiscoveries, zoneChanges, topMovers, trendingTopics, topLanguages } = report;

  const scanDate = new Date(overview.scanAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  const scanTime = new Date(overview.scanAt).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="data-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#E2E8F0] bg-gradient-to-r from-slate-50/80 to-[#007AFF]/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#007AFF]/10 flex items-center justify-center">
            <FileText className="w-4.5 h-4.5 text-[#007AFF]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Scan Report</h3>
            <p className="text-xs text-slate-400">{scanDate} · {scanTime}</p>
          </div>
        </div>
        <span className="text-xs font-bold text-[#007AFF] bg-[#007AFF]/10 px-2.5 py-1 rounded-lg">
          {overview.totalTracked} repos
        </span>
      </div>

      {/* Narrative */}
      <div className="px-5 py-4 border-b border-[#E2E8F0]">
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-700 leading-relaxed">{narrative}</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 border-b border-[#E2E8F0]">
        <div className="px-4 py-3 text-center border-r border-[#E2E8F0]">
          <div className="text-lg font-bold text-slate-900">{overview.risingCount}</div>
          <div className="text-xs text-slate-400">Rising</div>
        </div>
        <div className="px-4 py-3 text-center border-r border-[#E2E8F0]">
          <div className="text-lg font-bold text-[#F59E0B]">{overview.breakoutCount}</div>
          <div className="text-xs text-slate-400">Breakout</div>
        </div>
        <div className="px-4 py-3 text-center border-r border-[#E2E8F0]">
          <div className="text-lg font-bold text-slate-900">{overview.newCount}</div>
          <div className="text-xs text-slate-400">New</div>
        </div>
        <div className="px-4 py-3 text-center">
          <div className="text-lg font-bold text-slate-900">{overview.zoneChangeCount}</div>
          <div className="text-xs text-slate-400">Zone Δ</div>
        </div>
      </div>

      {/* Sections */}
      <div className="divide-y divide-[#E2E8F0]">
        {/* New Discoveries */}
        {newDiscoveries.length > 0 && (
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Discoveries</span>
            </div>
            <div className="space-y-2">
              {newDiscoveries.slice(0, 5).map(r => (
                <button
                  key={r.fullName}
                  onClick={() => openDrawer(r.fullName)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left group"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-semibold text-[#007AFF] group-hover:underline">{r.fullName}</span>
                    {r.description && (
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{r.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    {r.language && <span className="text-xs text-slate-400">{r.language}</span>}
                    <span className="text-xs font-bold text-slate-600">⭐ {r.stars.toLocaleString()}</span>
                  </div>
                </button>
              ))}
              {newDiscoveries.length > 5 && (
                <p className="text-xs text-slate-400 px-3 pt-1">+{newDiscoveries.length - 5} more</p>
              )}
            </div>
          </div>
        )}

        {/* Zone Changes */}
        {zoneChanges.length > 0 && (
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-3.5 h-3.5 text-[#007AFF]" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Zone Changes</span>
            </div>
            <div className="space-y-2">
              {zoneChanges.slice(0, 5).map(z => (
                <button
                  key={z.fullName}
                  onClick={() => openDrawer(z.fullName)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
                >
                  <span className="text-sm font-semibold text-slate-700">{z.fullName}</span>
                  <span className="text-xs">
                    <span className={ZONE_COLORS[z.from]}>{ZONE_EMOJI[z.from]} {z.from}</span>
                    <span className="text-slate-300 mx-1">→</span>
                    <span className={ZONE_COLORS[z.to]}>{ZONE_EMOJI[z.to]} {z.to}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Top Movers */}
        {topMovers.length > 0 && (
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-3.5 h-3.5 text-[#22C55E]" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Top Movers</span>
            </div>
            <div className="space-y-2">
              {topMovers.slice(0, 5).map(m => (
                <button
                  key={m.fullName}
                  onClick={() => openDrawer(m.fullName)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
                >
                  <span className="text-sm font-semibold text-slate-700">{m.fullName}</span>
                  <span className="text-xs font-bold text-[#22C55E]">+{m.starGain.toLocaleString()} ⭐</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Trending Topics */}
        {trendingTopics.length > 0 && (
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <ArrowUpRight className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trending Topics</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {trendingTopics.map(t => (
                <span
                  key={t.topic}
                  className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg"
                >
                  {t.topic} <span className="text-slate-400 ml-0.5">{t.risingCount}↑</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {topLanguages.length > 0 && (
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Code className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Top Languages</span>
            </div>
            <div className="space-y-1.5">
              {topLanguages.slice(0, 5).map(l => (
                <div key={l.language} className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 w-20 truncate">{l.language}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#007AFF]/30 rounded-full"
                      style={{ width: `${Math.max(5, l.pct)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 w-8 text-right">{l.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
