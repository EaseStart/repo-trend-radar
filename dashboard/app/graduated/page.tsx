import { getGraduated } from "@/lib/data";

export const metadata = { title: "Graduated — Repo Trend Radar" };

export default async function GraduatedPage() {
  const repos = await getGraduated();

  return (
    <>
      <header className="px-4 lg:px-8 h-20 flex items-center justify-between border-b border-[#E2E8F0] sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <h1 className="text-xl font-light tracking-tight text-slate-900">
          <span className="font-semibold">Graduated</span> Hall of Fame
        </h1>
        <span className="text-xs font-bold text-slate-400 uppercase">
          {repos.length} repos
        </span>
      </header>

      <div className="max-w-[1600px] mx-auto p-4 lg:p-8">
        {repos.length > 0 ? (
          <div className="grid gap-3">
            {repos.map((r) => (
              <div key={r.id} className="data-card p-5 flex items-center justify-between">
                <div>
                  <a
                    href={`https://github.com/${r.fullName}`}
                    target="_blank"
                    rel="noopener"
                    className="text-[#007AFF] font-semibold text-sm hover:underline"
                  >
                    {r.fullName}
                  </a>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{r.description}</p>
                  <div className="flex gap-1.5 mt-2">
                    {r.topics?.slice(0, 4).map((t) => (
                      <span key={t} className="text-xs bg-slate-100 rounded px-2 py-0.5 text-slate-500">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <div className="text-lg font-bold text-[#22C55E]">
                    ⭐ {r.finalStars.toLocaleString()}
                  </div>
                  {r.graduatedAt && (
                    <div className="text-xs text-slate-400">
                      {new Date(r.graduatedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="data-card p-12 text-center">
            <p className="text-lg text-slate-500 mb-2">No graduated repos yet</p>
            <p className="text-sm text-slate-400">
              Repos crossing 10,000 ⭐ stars will appear here
            </p>
          </div>
        )}
      </div>
    </>
  );
}
