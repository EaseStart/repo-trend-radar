import { getClusters } from "@/lib/data";
import ClusterCard from "@/components/ClusterCard";

export const metadata = { title: "Clusters — Repo Trend Radar" };

export default async function ClustersPage() {
  const clusters = await getClusters();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span>🎯</span> Trend Clusters
        </h1>
        <span className="text-sm text-[var(--text-secondary)]">
          {clusters.length} active
        </span>
      </div>

      <div className="grid gap-4">
        {clusters.length > 0 ? (
          clusters
            .sort((a, b) => b.confidence - a.confidence)
            .map((c) => (
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
          <div className="bg-[var(--bg-card)] border border-[#30363d] rounded-xl p-12 text-center">
            <p className="text-lg text-[var(--text-secondary)] mb-2">No clusters detected yet</p>
            <p className="text-sm text-[var(--text-muted)]">
              The crawler needs to run for several days to detect co-movement patterns
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
