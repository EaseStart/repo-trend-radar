import { getStats, getRepos, getGraduated } from '@/lib/data';
import { Zap, ArrowUpRight, Star, Activity, TrendingUp, Award } from 'lucide-react';
import { Sparkline, ZoneDistributionChart, TopLanguagesChart } from '@/components/Charts';
import RepoCard from '@/components/RepoCard';

export default async function Home() {
  const [stats, repos, graduated] = await Promise.all([getStats(), getRepos(), getGraduated()]);

  const breakoutRepos = repos.filter(r => r.zone === 'breakout').sort((a, b) => b.heatScore - a.heatScore);
  const risingRepos = repos.filter(r => r.zone === 'rising').sort((a, b) => b.stars - a.stars);
  const featuredRepo = breakoutRepos[0] ?? risingRepos[0] ?? null;
  const topRising = risingRepos.slice(0, 8);

  // Language distribution
  const langMap: Record<string, number> = {};
  for (const r of repos) {
    if (r.language) langMap[r.language] = (langMap[r.language] || 0) + 1;
  }
  const topLanguages = Object.entries(langMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([language, count]) => ({ language, count }));

  return (
    <>
      {/* HEADER */}
      <header className="px-4 lg:px-8 h-20 flex items-center justify-between border-b border-[#E2E8F0] sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <h1 className="text-xl font-light tracking-tight text-slate-900">
          <span className="font-semibold">Repo Trend</span> Radar
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
            Last scan: {stats.lastScanAt || 'Never'}
          </span>
          <div className="w-2 h-2 bg-[#22C55E] rounded-full animate-pulse" />
        </div>
      </header>

      {/* BENTO GRID */}
      <div className="max-w-[1600px] mx-auto p-4 lg:p-8 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-min stagger-in">
          
          {/* A. Stats Row — 4 metric cards */}
          <div className="col-span-1 lg:col-span-3 data-card p-6 flex flex-col justify-between min-h-[140px] group hover:border-[#007AFF]/30 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">Total Tracked</p>
                <span className="text-3xl font-mono font-bold text-slate-900">{stats.totalTracked.toLocaleString()}</span>
              </div>
              <Activity className="w-5 h-5 text-[#007AFF] opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex justify-between items-center">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Rising</span>
              <span className="text-sm font-mono font-bold text-[#007AFF]">{stats.risingCount.toLocaleString()}</span>
            </div>
          </div>

          <div className="col-span-1 lg:col-span-3 data-card p-6 flex flex-col justify-between min-h-[140px] group hover:border-[#F59E0B]/30 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">Breakout</p>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-mono font-bold text-slate-900">{stats.breakoutCount}</span>
                  {stats.breakoutCount > 0 && (
                    <span className="text-[10px] font-mono font-bold text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded-md">HOT</span>
                  )}
                </div>
              </div>
              <Zap className="w-5 h-5 text-[#F59E0B] opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex justify-between items-center">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Heat ≥ 0.5</span>
              <span className="text-sm font-mono font-bold text-[#F59E0B]">{breakoutRepos.length}</span>
            </div>
          </div>

          <div className="col-span-1 lg:col-span-3 data-card p-6 flex flex-col justify-between min-h-[140px] group hover:border-[#22C55E]/30 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">Graduated</p>
                <span className="text-3xl font-mono font-bold text-slate-900">{stats.graduatedCount}</span>
              </div>
              <Award className="w-5 h-5 text-[#22C55E] opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex justify-between items-center">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">10K+ ⭐</span>
              <span className="text-sm font-mono font-bold text-[#22C55E]">{graduated.length}</span>
            </div>
          </div>

          <div className="col-span-1 lg:col-span-3 data-card p-6 flex flex-col justify-between min-h-[140px] group hover:border-slate-300 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">Seedling</p>
                <span className="text-3xl font-mono font-bold text-slate-900">{stats.seedlingCount}</span>
              </div>
              <TrendingUp className="w-5 h-5 text-slate-400 opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex justify-between items-center">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Clusters</span>
              <span className="text-sm font-mono font-bold text-slate-500">{stats.activeClusters}</span>
            </div>
          </div>

          {/* B. Featured Breakout Repo (8 cols) */}
          <div className="col-span-1 lg:col-span-8 data-card p-6 min-h-[180px] flex flex-col relative overflow-hidden group">
            {featuredRepo ? (
              <>
                <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 pointer-events-none">
                  <Sparkline data={[10, 15, 12, 18, 25, 22, 30, 45, 40, 55, 60, 58, 70, 85, 90, 88, 100]} color="#007AFF" />
                </div>
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex gap-4 items-center">
                    <img src={`https://github.com/${featuredRepo.fullName.split('/')[0]}.png`} className="w-14 h-14 rounded-xl bg-slate-100 border border-white shadow-sm" alt="Avatar" />
                    <div>
                      <p className="text-[10px] font-mono font-bold text-[#F59E0B] uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> {featuredRepo.zone === 'breakout' ? 'BREAKOUT DETECTED' : 'TOP RISING'}
                      </p>
                      <h3 className="text-xl font-bold text-slate-900 leading-tight">{featuredRepo.fullName}</h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-md line-clamp-2">{featuredRepo.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-mono font-bold text-slate-900">⭐ {featuredRepo.stars.toLocaleString()}</div>
                    <p className="text-[10px] font-mono font-bold text-slate-400 uppercase">Stars</p>
                  </div>
                </div>
                <div className="mt-auto pt-4 flex gap-4 items-center relative z-10">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400" fill="currentColor" />
                    <span className="text-sm font-mono font-bold text-slate-700">{featuredRepo.stars.toLocaleString()}</span>
                  </div>
                  {featuredRepo.language && (
                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{featuredRepo.language}</span>
                  )}
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                    featuredRepo.zone === 'breakout' ? 'text-[#F59E0B] bg-[#F59E0B]/10' : 'text-[#007AFF] bg-[#007AFF]/10'
                  }`}>
                    {featuredRepo.zone.toUpperCase()}
                  </span>
                  <a 
                    href={`https://github.com/${featuredRepo.fullName}`}
                    target="_blank"
                    rel="noopener"
                    className="ml-auto flex items-center gap-1 text-[10px] font-mono font-bold px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    VIEW ON GITHUB <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 font-mono text-sm">No breakout repos detected yet</div>
            )}
          </div>

          {/* C. Breakout Repos List (4 cols) */}
          <div className="col-span-1 lg:col-span-4 data-card p-0 flex flex-col min-h-[180px] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E2E8F0] bg-slate-50/50 flex justify-between items-center">
              <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">🔥 Breakout Repos</h4>
              <span className="text-[10px] font-mono font-bold text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded-md">{breakoutRepos.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {breakoutRepos.length > 0 ? breakoutRepos.map((repo, idx) => (
                <a key={repo.id} href={`https://github.com/${repo.fullName}`} target="_blank" rel="noopener"
                  className="p-4 px-5 border-b border-[#E2E8F0] last:border-0 hover:bg-slate-50 transition-colors flex items-center justify-between group/item cursor-pointer block"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono font-bold text-slate-300 w-4">0{idx + 1}</span>
                    <div>
                      <h5 className="text-sm font-semibold text-slate-900 group-hover/item:text-[#007AFF] transition-colors">{repo.fullName.split('/')[1]}</h5>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{repo.fullName.split('/')[0]}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-slate-700">⭐ {repo.stars.toLocaleString()}</div>
                    {repo.language && <p className="text-[9px] font-mono text-slate-400 mt-0.5">{repo.language}</p>}
                  </div>
                </a>
              )) : (
                <div className="p-6 text-center text-sm text-slate-400 font-mono">No breakouts yet</div>
              )}
            </div>
          </div>

          {/* D. Zone Distribution Chart (8 cols) */}
          <div className="col-span-1 lg:col-span-8 data-card p-6 min-h-[340px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Zone Distribution</h3>
                <p className="text-[10px] font-mono font-bold text-slate-400 uppercase mt-1">Repos by lifecycle stage</p>
              </div>
            </div>
            <div className="flex-1 w-full min-h-[220px]">
              <ZoneDistributionChart
                seedling={stats.seedlingCount}
                rising={stats.risingCount}
                breakout={stats.breakoutCount}
                graduated={stats.graduatedCount}
              />
            </div>
          </div>

          {/* E. Top Languages (4 cols) */}
          <div className="col-span-1 lg:col-span-4 data-card p-6 min-h-[340px] flex flex-col">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-900">Top Languages</h3>
              <p className="text-[10px] font-mono font-bold text-slate-400 uppercase mt-1">Across {repos.length.toLocaleString()} repos</p>
            </div>
            <div className="flex-1 w-full min-h-[220px]">
              <TopLanguagesChart data={topLanguages} />
            </div>
          </div>

          {/* F. Top Rising Repos Grid (12 cols) */}
          <div className="col-span-1 lg:col-span-12 data-card p-0 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0] bg-slate-50/50 flex justify-between items-center">
              <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">📈 Top Rising Repos</h4>
              <span className="text-[10px] font-mono font-bold text-[#007AFF] bg-[#007AFF]/10 px-2 py-0.5 rounded-md">{stats.risingCount.toLocaleString()} total</span>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse">
                <thead>
                  <tr className="text-left border-b border-[#E2E8F0]">
                    <th className="py-3 px-6 text-[10px] font-mono text-slate-400 uppercase font-bold w-8">#</th>
                    <th className="py-3 px-3 text-[10px] font-mono text-slate-400 uppercase font-bold">Repository</th>
                    <th className="py-3 px-3 text-[10px] font-mono text-slate-400 uppercase font-bold">Language</th>
                    <th className="py-3 px-3 text-[10px] font-mono text-slate-400 uppercase font-bold text-right">Stars</th>
                    <th className="py-3 px-3 text-[10px] font-mono text-slate-400 uppercase font-bold text-right">Forks</th>
                    <th className="py-3 px-6 text-[10px] font-mono text-slate-400 uppercase font-bold text-right">Heat</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-mono">
                  {topRising.map((repo, i) => (
                    <tr key={repo.id} className="border-b border-[#E2E8F0] hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-6 text-[10px] text-slate-300 font-bold">{String(i + 1).padStart(2, '0')}</td>
                      <td className="py-3 px-3">
                        <a href={`https://github.com/${repo.fullName}`} target="_blank" rel="noopener" className="text-[#007AFF] hover:underline font-medium text-xs">
                          {repo.fullName}
                        </a>
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 max-w-xs">{repo.description}</p>
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-500">{repo.language || '—'}</td>
                      <td className="py-3 px-3 text-xs text-slate-700 font-bold text-right">{repo.stars.toLocaleString()}</td>
                      <td className="py-3 px-3 text-xs text-slate-500 text-right">{repo.forks.toLocaleString()}</td>
                      <td className="py-3 px-6 text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          repo.heatScore >= 0.5 ? 'text-[#F59E0B] bg-[#F59E0B]/10' : 'text-slate-400 bg-slate-100'
                        }`}>
                          {repo.heatScore.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-[#E2E8F0] bg-slate-50 flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400">Showing top {topRising.length} of {stats.risingCount.toLocaleString()} rising repos</span>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
