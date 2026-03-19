import { getStats, getClusters } from '@/lib/data';
import { Search, Bell, Zap, AlertTriangle, ArrowUpRight, GitFork, Star, Activity } from 'lucide-react';
import { Sparkline, MainLineChart, RadarHealthChart, ContributorBarChart } from '@/components/Charts';

export default async function Home() {
  const [stats, clusters] = await Promise.all([getStats(), getClusters()]);

  const allGrowingRepos = clusters.flatMap(c => c.growingRepos).sort((a, b) => b.growth_pct - a.growth_pct);
  const featuredRepo = allGrowingRepos.length > 0 ? allGrowingRepos[0] : null;
  const sideRepos = allGrowingRepos.slice(1, 4);
  const compareRepos = allGrowingRepos.slice(0, 3);
  const avgGlobalVelocity = clusters.length > 0 ? (clusters.reduce((acc, c) => acc + c.avgVelocity, 0) / clusters.length).toFixed(1) : '0';

  return (
    <>
      {/* HEADER */}
      <header className="max-w-[1600px] mx-auto px-4 lg:px-8 h-20 flex items-center justify-between border-b border-[#E2E8F0] sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <h1 className="text-xl font-light tracking-tight text-slate-900 hidden md:block">
          <span className="font-semibold">Terminal</span> Workspace
        </h1>
        <div className="flex-1 max-w-xl mx-8">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#007AFF] transition-colors" />
            <input type="text" placeholder="COMMAND / SEARCH..." className="w-full bg-slate-100 blueprint-border rounded-xl py-2 pl-10 pr-4 text-xs font-mono tracking-wider focus:outline-none focus:border-[#007AFF] focus:bg-white transition-all" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <select className="bg-white blueprint-border text-[10px] font-mono px-3 py-1.5 rounded-lg focus:outline-none focus:border-[#007AFF] cursor-pointer outline-none">
            <option>LAST 24 HOURS</option>
            <option>LAST 7 DAYS</option>
          </select>
          <div className="w-8 h-8 blueprint-border rounded-lg flex items-center justify-center hover:bg-slate-50 cursor-pointer transition-colors relative">
            <Bell className="w-4 h-4 text-slate-500" />
            <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#F59E0B] rounded-full border border-white"></div>
          </div>
        </div>
      </header>

      {/* BENTO GRID */}
      <div className="max-w-[1600px] mx-auto p-4 lg:p-8 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-min stagger-in">
          
          {/* A. Global Metrics (3 cols) */}
          <div className="col-span-1 lg:col-span-3 data-card p-6 flex flex-col justify-between min-h-[160px] group hover:border-[#007AFF]/30 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">Global Velocity</p>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-mono font-bold text-slate-900">{stats.risingCount + stats.breakoutCount}</span>
                  <span className="text-[10px] font-mono font-bold text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded-md">+{avgGlobalVelocity}%</span>
                </div>
              </div>
              <Activity className="w-5 h-5 text-[#007AFF] opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="mt-8 pt-4 border-t border-[#E2E8F0] flex justify-between items-center">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Active Nodes</span>
              <span className="text-sm font-mono font-bold text-slate-900">{stats.totalTracked.toLocaleString()}</span>
            </div>
          </div>

          {/* B. Featured Breakout Repo (6 cols) */}
          <div className="col-span-1 lg:col-span-6 data-card p-6 min-h-[160px] flex flex-col relative overflow-hidden group">
            {featuredRepo ? (
              <>
                <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 pointer-events-none">
                  <Sparkline data={[10, 15, 12, 18, 25, 22, 30, 45, 40, 55, 60, 58, 70, 85, 90, 88, 100]} color="#007AFF" />
                </div>
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex gap-4 items-center">
                    <img src={`https://github.com/${featuredRepo.full_name.split('/')[0]}.png`} className="w-12 h-12 rounded-xl bg-slate-100 border border-white shadow-sm" alt="Avatar" />
                    <div>
                      <p className="text-[10px] font-mono font-bold text-[#007AFF] uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Alpha detected
                      </p>
                      <h3 className="text-xl font-bold text-slate-900 leading-tight">{featuredRepo.full_name}</h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-mono font-bold text-[#22C55E]">+{featuredRepo.growth_pct.toFixed(1)}%</div>
                    <p className="text-[10px] font-mono font-bold text-slate-400 uppercase">Velocity</p>
                  </div>
                </div>
                <div className="mt-auto pt-6 flex gap-6 relative z-10">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400" fill="currentColor" />
                    <span className="text-sm font-mono font-bold text-slate-700">{featuredRepo.stars.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GitFork className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-mono font-bold text-slate-700">1.2k</span>
                  </div>
                  <button className="ml-auto flex items-center gap-1 text-[10px] font-mono font-bold px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
                    ANALYZE <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 font-mono text-sm">No primary anomaly detected</div>
            )}
          </div>

          {/* C. Alerts (3 cols) */}
          <div className="col-span-1 lg:col-span-3 data-card p-0 flex flex-col min-h-[160px] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E2E8F0] bg-slate-50/50">
              <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">System Alerts</h4>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
              {clusters.slice(0, 2).map((cluster, i) => (
                <div key={cluster.topic} className={`p-4 border-b border-[#E2E8F0] last:border-0 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${i === 0 ? 'bg-[#007AFF]/10 text-[#007AFF]' : 'bg-amber-500/10 text-amber-500'}`}>
                    {i === 0 ? <Zap className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 leading-tight mb-1">{cluster.topic} trending</p>
                    <p className="text-[10px] text-slate-500 font-mono">{cluster.growingCount} repos spiked</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* D. Main Analytics Line Chart (8 cols) */}
          <div className="col-span-1 lg:col-span-8 data-card p-6 min-h-[380px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Ecosystem Growth Trajectory</h3>
                <p className="text-[10px] font-mono font-bold text-slate-400 uppercase mt-1">Commits vs Stars Tracking</p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-[10px] font-mono font-bold blueprint-border text-slate-500 rounded-md hover:bg-slate-50 transition-colors">YTD</button>
                <button className="px-3 py-1.5 text-[10px] font-mono font-bold bg-slate-900 text-white rounded-md">6MO</button>
              </div>
            </div>
            <div className="flex-1 w-full min-h-[250px]">
              <MainLineChart />
            </div>
          </div>

          {/* E. Health Radar (4 cols) */}
          <div className="col-span-1 lg:col-span-4 data-card p-6 min-h-[380px] flex flex-col">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-900">Community Health</h3>
              <p className="text-[10px] font-mono font-bold text-slate-400 uppercase mt-1">Aggregate Stability Score</p>
            </div>
            <div className="flex-1 flex items-center justify-center -ml-4">
              <RadarHealthChart />
            </div>
          </div>

          {/* F. Side Repos List (4 cols) */}
          <div className="col-span-1 lg:col-span-4 data-card p-0 flex flex-col min-h-[320px] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0] bg-slate-50/50 flex justify-between items-center">
              <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Rising Stars Core</h4>
              <span className="text-[10px] font-mono font-bold text-[#007AFF] bg-[#007AFF]/10 px-2 py-0.5 rounded-md">LIVE</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {sideRepos.map((repo, idx) => (
                <div key={repo.full_name} className="p-4 px-6 border-b border-[#E2E8F0] last:border-0 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-mono font-bold text-slate-300 w-4">0{idx + 1}</span>
                    <div>
                      <h5 className="text-sm font-semibold text-slate-900 group-hover:text-[#007AFF] transition-colors">{repo.full_name.split('/')[1]}</h5>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{repo.full_name.split('/')[0]}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div className="w-16 h-6 opacity-40 group-hover:opacity-100 transition-opacity">
                      <Sparkline data={Array.from({length: 8}, () => Math.random() * 100)} color={idx === 1 ? '#F59E0B' : '#007AFF'} />
                    </div>
                    <div>
                      <div className="text-xs font-mono font-bold text-[#22C55E]">+{repo.growth_pct.toFixed(0)}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* G. Comparative Matrix (8 cols) */}
          <div className="col-span-1 lg:col-span-8 data-card p-0 flex flex-col min-h-[320px] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0] bg-slate-50/50 flex justify-between items-center">
              <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Comparative Matrix</h4>
              <button className="text-[10px] font-mono font-bold text-slate-500 hover:text-slate-900 transition-colors">EDIT COLUMNS</button>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse">
                <thead>
                  <tr className="text-left border-b border-[#E2E8F0]">
                    <th className="py-4 px-6 text-[10px] font-mono text-slate-400 uppercase font-bold w-1/4">Metric</th>
                    {compareRepos.map((repo, i) => (
                      <th key={repo.full_name} className="py-4 px-6 w-1/4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-sm ${i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-amber-500' : 'bg-purple-500'}`}></div>
                          <span className="text-xs font-mono font-bold text-slate-900 truncate max-w-[120px]">{repo.full_name.split('/')[1]}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-sm font-mono">
                  <tr className="border-b border-[#E2E8F0] hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-[11px] text-slate-500 font-bold">Growth Velocity</td>
                    {compareRepos.map(r => <td key={r.full_name} className="py-4 px-6 text-[#22C55E] font-bold">+{r.growth_pct.toFixed(1)}%</td>)}
                  </tr>
                  <tr className="border-b border-[#E2E8F0] hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-[11px] text-slate-500 font-bold">Total Network</td>
                    {compareRepos.map(r => <td key={r.full_name} className="py-4 px-6 text-slate-700 font-bold">{r.stars.toLocaleString()}</td>)}
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 text-[11px] text-slate-500 font-bold">Primary Vector</td>
                    <td className="py-4 px-6 text-slate-700 font-bold">{clusters[0]?.topic || '-'}</td>
                    <td className="py-4 px-6 text-slate-700 font-bold">{clusters[1]?.topic || '-'}</td>
                    <td className="py-4 px-6 text-[#22C55E] font-bold">{clusters[2]?.topic || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-auto px-6 py-4 border-t border-[#E2E8F0] bg-slate-50 flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400">Showing top 3 trending assets</span>
              <button className="text-[10px] font-mono font-bold text-[#007AFF] hover:underline">VIEW FULL MATRIX →</button>
            </div>
          </div>
          
        </div>
      </div>
    </>
  );
}
