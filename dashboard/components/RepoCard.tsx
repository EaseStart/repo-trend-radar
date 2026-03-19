"use client";

interface RepoCardProps {
  fullName: string;
  description: string;
  language: string;
  stars: number;
  zone: string;
  heatScore: number;
  starVelocity7d?: number;
  tractionSignals?: string[];
}

const zoneConfig: Record<string, { label: string; color: string; icon: string }> = {
  seedling: { label: "Seedling", color: "var(--zone-seedling)", icon: "🌱" },
  rising: { label: "Rising", color: "var(--zone-rising)", icon: "📈" },
  breakout: { label: "Breakout", color: "var(--zone-breakout)", icon: "🔥" },
  graduated: { label: "Graduated", color: "var(--zone-graduated)", icon: "🏛️" },
};

const langColors: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  Java: "#b07219",
  C: "#555555",
  "C++": "#f34b7d",
  Ruby: "#701516",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
};

export default function RepoCard({
  fullName,
  description,
  language,
  stars,
  zone,
  heatScore,
  starVelocity7d,
  tractionSignals,
}: RepoCardProps) {
  const z = zoneConfig[zone] || zoneConfig.seedling;

  return (
    <div className="bg-[var(--bg-card)] border border-[#30363d] rounded-lg p-4 hover:border-[#58a6ff33] transition-colors">
      <div className="flex items-start justify-between mb-2">
        <a
          href={`https://github.com/${fullName}`}
          target="_blank"
          rel="noopener"
          className="text-[var(--accent-blue)] font-medium text-sm hover:underline"
        >
          {fullName}
        </a>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ background: `${z.color}22`, color: z.color }}
        >
          {z.icon} {z.label}
        </span>
      </div>

      <p className="text-xs text-[var(--text-secondary)] mb-3 line-clamp-2">{description}</p>

      <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
        {language && (
          <span className="flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ background: langColors[language] || "#8b949e" }}
            />
            {language}
          </span>
        )}
        <span>⭐ {stars.toLocaleString()}</span>
        {starVelocity7d !== undefined && starVelocity7d > 0 && (
          <span className="text-[var(--accent-green)]">
            ↑ +{starVelocity7d}/7d
          </span>
        )}
      </div>

      {tractionSignals && tractionSignals.length > 0 && (
        <div className="mt-2 flex gap-1">
          {tractionSignals.includes("star_chart") && <span title="Star chart">⭐</span>}
          {tractionSignals.includes("used_by") && <span title="Used by companies">🏢</span>}
          {tractionSignals.includes("downloads") && <span title="Download stats">📥</span>}
          {tractionSignals.includes("growth_chart") && <span title="Growth chart">📊</span>}
        </div>
      )}
    </div>
  );
}
