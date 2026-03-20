'use client';

import { useRouter } from 'next/navigation';
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
  const router = useRouter();
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
        <button
          onClick={() => router.push('/repos')}
          className="text-xs font-bold text-[#007AFF] bg-[#007AFF]/10 px-2.5 py-1 rounded-lg hover:ring-1 hover:ring-[#007AFF]/30 transition-all cursor-pointer"
        >
          {overview.totalTracked} repos →
        </button>
      </div>

      {/* Narrative */}
      <div className="px-5 py-4 border-b border-[#E2E8F0]">
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-700 leading-relaxed">{narrative}</p>
        </div>
      </div>

      {/* Stats Row — clickable */}
      <div className="grid grid-cols-4 border-b border-[#E2E8F0]">
        <button
          onClick={() => router.push('/repos?zone=rising')}
          className="px-4 py-3 text-center border-r border-[#E2E8F0] hover:bg-slate-50 transition-colors cursor-pointer group"
        >
          <div className="text-lg font-bold text-slate-900 group-hover:text-[#007AFF] transition-colors">{overview.risingCount}</div>
          <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
            Rising <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </button>
        <button
          onClick={() => router.push('/repos?zone=breakout')}
          className="px-4 py-3 text-center border-r border-[#E2E8F0] hover:bg-slate-50 transition-colors cursor-pointer group"
        >
          <div className="text-lg font-bold text-[#F59E0B] group-hover:scale-110 transition-transform">{overview.breakoutCount}</div>
          <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
            Breakout <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </button>
        <button
          onClick={() => router.push('/repos')}
          className="px-4 py-3 text-center border-r border-[#E2E8F0] hover:bg-slate-50 transition-colors cursor-pointer group"
        >
          <div className="text-lg font-bold text-slate-900 group-hover:text-[#007AFF] transition-colors">{overview.newCount}</div>
          <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
            New <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </button>
        <button
          onClick={() => router.push('/repos')}
          className="px-4 py-3 text-center hover:bg-slate-50 transition-colors cursor-pointer group"
        >
          <div className="text-lg font-bold text-slate-900 group-hover:text-[#007AFF] transition-colors">{overview.zoneChangeCount}</div>
          <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
            Zone Δ <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </button>
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
                  onClick={() => openDrawer(r.fullName, newDiscoveries.map(d => d.fullName))}
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
                  onClick={() => openDrawer(z.fullName, zoneChanges.map(c => c.fullName))}
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
                  onClick={() => openDrawer(m.fullName, topMovers.map(mv => mv.fullName))}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
                >
                  <span className="text-sm font-semibold text-slate-700">{m.fullName}</span>
                  <span className="text-xs font-bold text-[#22C55E]">+{m.starGain.toLocaleString()} ⭐</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Trending Topics — clickable chips */}
        {trendingTopics.length > 0 && (
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <ArrowUpRight className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trending Topics</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {trendingTopics.map(t => (
                <button
                  key={t.topic}
                  onClick={() => router.push(`/repos?topic=${encodeURIComponent(t.topic)}`)}
                  className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg hover:bg-[#007AFF]/10 hover:text-[#007AFF] transition-colors cursor-pointer"
                >
                  {t.topic} <span className="text-slate-400 ml-0.5">{t.risingCount}↑</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Languages — clickable bars */}
        {topLanguages.length > 0 && (
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Code className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Top Languages</span>
            </div>
            <div className="space-y-1.5">
              {topLanguages.slice(0, 5).map(l => (
                <button
                  key={l.language}
                  onClick={() => router.push(`/repos?language=${encodeURIComponent(l.language)}`)}
                  className="w-full flex items-center gap-3 hover:bg-slate-50 rounded-lg px-1 py-0.5 transition-colors cursor-pointer group"
                >
                  <span className="text-xs text-slate-600 w-20 truncate group-hover:text-[#007AFF] transition-colors">{l.language}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#007AFF]/30 rounded-full group-hover:bg-[#007AFF]/50 transition-colors"
                      style={{ width: `${Math.max(5, l.pct)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 w-8 text-right">{l.pct}%</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
