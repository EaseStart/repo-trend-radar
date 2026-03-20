import { getClusters } from "@/lib/data";
import ClusterCard from "@/components/ClusterCard";

export const metadata = { title: "Clusters — Repo Trend Radar" };

export default async function ClustersPage() {
  const clusters = await getClusters();

  return (
    <>
      <header className="px-4 lg:px-8 h-20 flex items-center justify-between border-b border-[#E2E8F0] sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <h1 className="text-xl font-light tracking-tight text-slate-900">
          <span className="font-semibold">Trend</span> Clusters
        </h1>
        <span className="text-xs font-bold text-slate-400 uppercase">
          {clusters.length} active
        </span>
      </header>

      <div className="max-w-[1600px] mx-auto p-4 lg:p-8">
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
            <div className="data-card p-12 text-center">
              <p className="text-lg text-slate-500 mb-2">No clusters detected yet</p>
              <p className="text-sm text-slate-400">
                The crawler needs to run for several days to detect co-movement patterns
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
