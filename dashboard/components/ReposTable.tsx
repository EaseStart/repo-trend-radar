'use client';

import { useState, useMemo } from 'react';
import { Search, X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface RepoData {
  id: number;
  fullName: string;
  description: string;
  language: string;
  topics: string[];
  zone: string;
  stars: number;
  forks: number;
  heatScore: number;
}

interface ReposTableProps {
  repos: RepoData[];
  languages: string[];
}

type SortKey = 'stars' | 'forks' | 'heatScore';
type SortDir = 'asc' | 'desc';

const ZONES = ['all', 'breakout', 'rising', 'seedling'] as const;
const ZONE_STYLES: Record<string, { label: string; active: string; idle: string }> = {
  all:       { label: 'All',       active: 'bg-slate-900 text-white',          idle: 'bg-white text-slate-600 hover:bg-slate-50' },
  breakout:  { label: 'Breakout',  active: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30', idle: 'bg-white text-slate-600 hover:bg-slate-50' },
  rising:    { label: 'Rising',    active: 'bg-[#007AFF]/10 text-[#007AFF] border-[#007AFF]/30', idle: 'bg-white text-slate-600 hover:bg-slate-50' },
  seedling:  { label: 'Seedling',  active: 'bg-slate-100 text-slate-700',      idle: 'bg-white text-slate-600 hover:bg-slate-50' },
};

const ZONE_BADGE: Record<string, string> = {
  breakout: 'text-[#F59E0B] bg-[#F59E0B]/10',
  rising:   'text-[#007AFF] bg-[#007AFF]/10',
  seedling: 'text-slate-500 bg-slate-100',
};

const PAGE_SIZE = 25;

export default function ReposTable({ repos, languages }: ReposTableProps) {
  const [search, setSearch] = useState('');
  const [zone, setZone] = useState<string>('all');
  const [language, setLanguage] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('stars');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

  const hasFilters = search || zone !== 'all' || language !== 'all';

  const filtered = useMemo(() => {
    let result = repos;

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        r.fullName.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q))
      );
    }

    // Zone filter
    if (zone !== 'all') {
      result = result.filter(r => r.zone === zone);
    }

    // Language filter
    if (language !== 'all') {
      result = result.filter(r => r.language === language);
    }

    // Sort
    result = [...result].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      return sortDir === 'desc' ? bv - av : av - bv;
    });

    return result;
  }, [repos, search, zone, language, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  function clearAll() {
    setSearch('');
    setZone('all');
    setLanguage('all');
    setSortKey('stars');
    setSortDir('desc');
    setPage(1);
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronDown className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" />;
    return sortDir === 'desc'
      ? <ChevronDown className="w-3 h-3 text-[#007AFF]" />
      : <ChevronUp className="w-3 h-3 text-[#007AFF]" />;
  }

  return (
    <div className="space-y-4">
      {/* FILTER BAR */}
      <div className="data-card p-4 flex flex-col lg:flex-row gap-4 items-start lg:items-center sticky top-20 z-40 bg-white/95 backdrop-blur-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search repos..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 focus:border-[#007AFF] transition-all placeholder:text-slate-400"
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Zone chips */}
        <div className="flex gap-2">
          {ZONES.map(z => {
            const isActive = zone === z;
            const style = ZONE_STYLES[z];
            return (
              <button
                key={z}
                onClick={() => { setZone(z); setPage(1); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  isActive ? style.active + ' border-current' : style.idle + ' border-[#E2E8F0]'
                }`}
              >
                {style.label}
              </button>
            );
          })}
        </div>

        {/* Language dropdown */}
        <select
          value={language}
          onChange={e => { setLanguage(e.target.value); setPage(1); }}
          className="px-3 py-2.5 text-xs font-bold bg-slate-50 border border-[#E2E8F0] rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20 min-w-[140px]"
        >
          <option value="all">All Languages</option>
          {languages.map(l => <option key={l} value={l}>{l}</option>)}
        </select>

        {/* Result count + Clear */}
        <div className="flex items-center gap-3 ml-auto">
          <span className="text-xs font-bold text-slate-400">
            {filtered.length.toLocaleString()} {filtered.length === 1 ? 'repo' : 'repos'}
          </span>
          {hasFilters && (
            <button onClick={clearAll} className="text-xs font-bold text-[#007AFF] hover:underline">
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="data-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse">
            <thead>
              <tr className="text-left border-b border-[#E2E8F0]">
                <th className="py-3 px-4 text-xs text-slate-400 uppercase font-bold w-12">#</th>
                <th className="py-3 px-4 text-xs text-slate-400 uppercase font-bold">Repository</th>
                <th className="py-3 px-4 text-xs text-slate-400 uppercase font-bold">Language</th>
                <th className="py-3 px-4 text-xs text-slate-400 uppercase font-bold">Zone</th>
                <th className="py-3 px-4 text-xs text-slate-400 uppercase font-bold text-right cursor-pointer group select-none" onClick={() => handleSort('stars')}>
                  <span className="inline-flex items-center gap-1">Stars <SortIcon col="stars" /></span>
                </th>
                <th className="py-3 px-4 text-xs text-slate-400 uppercase font-bold text-right cursor-pointer group select-none" onClick={() => handleSort('forks')}>
                  <span className="inline-flex items-center gap-1">Forks <SortIcon col="forks" /></span>
                </th>
                <th className="py-3 px-4 text-xs text-slate-400 uppercase font-bold text-right cursor-pointer group select-none" onClick={() => handleSort('heatScore')}>
                  <span className="inline-flex items-center gap-1">Heat <SortIcon col="heatScore" /></span>
                </th>
              </tr>
            </thead>
            <tbody>
              {paged.length > 0 ? paged.map((repo, i) => {
                const globalIdx = (safePage - 1) * PAGE_SIZE + i + 1;
                return (
                  <tr key={repo.id} className="border-b border-[#E2E8F0] hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-xs text-slate-300 font-bold">{String(globalIdx).padStart(2, '0')}</td>
                    <td className="py-3 px-4">
                      <a href={`https://github.com/${repo.fullName}`} target="_blank" rel="noopener" className="text-[#007AFF] hover:underline font-semibold text-sm">
                        {repo.fullName}
                      </a>
                      {repo.description && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 max-w-md">{repo.description}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">{repo.language || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${ZONE_BADGE[repo.zone] || 'text-slate-400 bg-slate-100'}`}>
                        {repo.zone.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-700 font-bold text-right">{repo.stars.toLocaleString()}</td>
                    <td className="py-3 px-4 text-xs text-slate-500 text-right">{repo.forks.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        repo.heatScore >= 0.5 ? 'text-[#F59E0B] bg-[#F59E0B]/10' : 'text-slate-400 bg-slate-100'
                      }`}>
                        {repo.heatScore.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-slate-400">
                    No repos match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-[#E2E8F0] bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">
              Showing {((safePage - 1) * PAGE_SIZE) + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length.toLocaleString()}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={safePage <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-[#E2E8F0] text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (safePage <= 3) {
                  pageNum = i + 1;
                } else if (safePage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = safePage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      pageNum === safePage
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                disabled={safePage >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-[#E2E8F0] text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
