import { getStats, getClusters } from "@/lib/data";
import ClusterCard from "@/components/ClusterCard";

export default async function Home() {
  const [stats, clusters] = await Promise.all([getStats(), getClusters()]);

  const statCards = [
    { label: "Tracked", value: stats.totalTracked, icon: "📡" },
    { label: "Rising", value: stats.risingCount, icon: "📈", color: "var(--zone-rising)" },
    { label: "Breakout", value: stats.breakoutCount, icon: "🔥", color: "var(--zone-breakout)" },
    { label: "Clusters", value: stats.activeClusters, icon: "🎯", color: "var(--accent-orange)" },
  ];

  return (
    <div className="space-y-8">
      {/* Hero stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-[var(--bg-card)] border border-[#30363d] rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-3xl font-bold" style={{ color: s.color || "var(--text-primary)" }}>
              {s.value.toLocaleString()}
            </div>
            <div className="text-sm text-[var(--text-secondary)]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Active clusters */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <span>🔥</span> Active Clusters
          </h2>
          <a href="/clusters" className="text-sm text-[var(--accent-blue)]">View all →</a>
        </div>
        <div className="grid gap-4">
          {clusters.length > 0 ? (
            clusters.slice(0, 5).map((c) => (
              <ClusterCard
                key={c.topic}
                topic={c.topic}
                confidence={c.confidence}
                growingCount={c.growingCount}
                totalCount={c.totalCount}
                avgVelocity={c.avgVelocity}
                graduatedCorrelation={c.graduatedCorrelation}
                growingRepos={c.growingRepos}
              />
            ))
          ) : (
            <div className="bg-[var(--bg-card)] border border-[#30363d] rounded-xl p-8 text-center text-[var(--text-secondary)]">
              <p className="text-lg mb-2">No clusters detected yet</p>
              <p className="text-sm">Run the crawler to start discovering trends</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer info */}
      {stats.lastScanAt && (
        <p className="text-xs text-[var(--text-muted)] text-center">
          Last scan: {new Date(stats.lastScanAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
