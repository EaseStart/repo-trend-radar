import { getGraduated } from "@/lib/data";

export const metadata = { title: "Graduated — Repo Trend Radar" };

export default async function GraduatedPage() {
  const repos = await getGraduated();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span>🏛️</span> Graduated Hall of Fame
        </h1>
        <span className="text-sm text-[var(--text-secondary)]">
          {repos.length} repos
        </span>
      </div>

      {repos.length > 0 ? (
        <div className="grid gap-3">
          {repos.map((r) => (
            <div key={r.id} className="bg-[var(--bg-card)] border border-[#30363d] rounded-lg p-4 flex items-center justify-between">
              <div>
                <a
                  href={`https://github.com/${r.fullName}`}
                  target="_blank"
                  rel="noopener"
                  className="text-[var(--accent-blue)] font-medium text-sm hover:underline"
                >
                  {r.fullName}
                </a>
                <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-1">{r.description}</p>
                <div className="flex gap-1.5 mt-2">
                  {r.topics?.slice(0, 4).map((t) => (
                    <span key={t} className="text-xs bg-[var(--bg-tertiary)] rounded px-2 py-0.5 text-[var(--text-muted)]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <div className="text-lg font-bold text-[var(--accent-green)]">
                  ⭐ {r.finalStars.toLocaleString()}
                </div>
                {r.graduatedAt && (
                  <div className="text-xs text-[var(--text-muted)]">
                    {new Date(r.graduatedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] border border-[#30363d] rounded-xl p-12 text-center">
          <p className="text-lg text-[var(--text-secondary)] mb-2">No graduated repos yet</p>
          <p className="text-sm text-[var(--text-muted)]">
            Repos crossing 10,000 ⭐ stars will appear here
          </p>
        </div>
      )}
    </div>
  );
}
