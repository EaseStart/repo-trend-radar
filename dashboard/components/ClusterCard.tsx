"use client";

import { type RepoVelocity } from "@/lib/data";

interface ClusterCardProps {
  topic: string;
  confidence: number;
  growingCount: number;
  totalCount: number;
  avgVelocity: number;
  graduatedCorrelation: number;
  growingRepos: RepoVelocity[];
}

export default function ClusterCard({
  topic,
  confidence,
  growingCount,
  totalCount,
  avgVelocity,
  graduatedCorrelation,
  growingRepos,
}: ClusterCardProps) {
  const confPct = Math.round(confidence * 100);
  const confColor =
    confPct >= 80 ? "#22C55E" : confPct >= 50 ? "#007AFF" : "#F59E0B";

  return (
    <div className="data-card p-5 hover:border-[#007AFF]/20 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <span className="text-xl">🔥</span>
            {topic}
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            {growingCount} of {totalCount} repos growing · avg +{avgVelocity.toFixed(1)}%/week
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold" style={{ color: confColor }}>
            {confPct}%
          </div>
          <div className="text-xs text-slate-400">confidence</div>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="w-full h-2 bg-slate-100 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${confPct}%`, background: confColor }}
        />
      </div>

      {/* Growing repos */}
      <div className="flex flex-wrap gap-2 mb-3">
        {growingRepos.slice(0, 5).map((repo) => (
          <div
            key={repo.full_name}
            className="bg-slate-100 rounded-lg px-3 py-1.5 text-xs flex items-center gap-1.5"
          >
            <span className="text-slate-900 font-medium">
              {repo.full_name.split("/")[1]}
            </span>
            <span className="text-[#22C55E]">
              +{repo.star_velocity_7d}⭐
            </span>
          </div>
        ))}
      </div>

      {/* Graduated correlation */}
      {graduatedCorrelation > 0 && (
        <div className="text-xs text-slate-400 flex items-center gap-1">
          <span>🏛️</span>
          <span>{graduatedCorrelation} graduated repos in ecosystem</span>
        </div>
      )}
    </div>
  );
}
