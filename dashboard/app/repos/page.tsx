import { getRepos } from '@/lib/data';
import ReposTable from '@/components/ReposTable';

export const metadata = { title: 'All Repos — Repo Trend Radar' };

export default async function ReposPage() {
  const repos = await getRepos();

  // Extract unique languages for filter dropdown
  const languages = Array.from(new Set(repos.map(r => r.language).filter(Boolean))).sort();

  return (
    <>
      <header className="px-4 lg:px-8 h-20 flex items-center justify-between border-b border-[#E2E8F0] sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <h1 className="text-xl font-light tracking-tight text-slate-900">
          <span className="font-semibold">All</span> Repos
        </h1>
        <span className="text-xs font-bold text-slate-400 uppercase">
          {repos.length.toLocaleString()} tracked
        </span>
      </header>

      <div className="max-w-[1600px] mx-auto p-4 lg:p-8">
        <ReposTable repos={repos} languages={languages} />
      </div>
    </>
  );
}
