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
    confPct >= 80 ? "var(--accent-green)" : confPct >= 50 ? "var(--accent-blue)" : "var(--accent-orange)";

  return (
    <div className="bg-[var(--bg-card)] border border-[#30363d] rounded-xl p-5 hover:border-[#58a6ff33] transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <span className="text-xl">🔥</span>
            {topic}
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {growingCount} of {totalCount} repos growing · avg +{avgVelocity.toFixed(1)}%/week
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold" style={{ color: confColor }}>
            {confPct}%
          </div>
          <div className="text-xs text-[var(--text-muted)]">confidence</div>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="w-full h-2 bg-[var(--bg-tertiary)] rounded-full mb-4 overflow-hidden">
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
            className="bg-[var(--bg-tertiary)] rounded-lg px-3 py-1.5 text-xs flex items-center gap-1.5"
          >
            <span className="text-[var(--text-primary)] font-medium">
              {repo.full_name.split("/")[1]}
            </span>
            <span className="text-[var(--accent-green)]">
              +{repo.star_velocity_7d}⭐
            </span>
          </div>
        ))}
      </div>

      {/* Graduated correlation */}
      {graduatedCorrelation > 0 && (
        <div className="text-xs text-[var(--text-muted)] flex items-center gap-1">
          <span>🏛️</span>
          <span>{graduatedCorrelation} graduated repos in ecosystem</span>
        </div>
      )}
    </div>
  );
}
