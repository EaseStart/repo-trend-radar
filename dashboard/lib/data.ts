import { promises as fs } from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "public", "data");

async function readJSON<T>(filename: string): Promise<T> {
  try {
    const filePath = path.join(dataDir, filename);
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return (Array.isArray({} as T) ? [] : {}) as T;
  }
}

// --- Types ---

export interface Stats {
  totalTracked: number;
  seedlingCount: number;
  risingCount: number;
  breakoutCount: number;
  graduatedCount: number;
  activeClusters: number;
  lastScanAt: string;
}

export interface RepoVelocity {
  full_name: string;
  stars: number;
  star_velocity_7d: number;
  growth_pct: number;
}

export interface ClusterAlert {
  id: number;
  topic: string;
  detectedAt: string;
  growingCount: number;
  totalCount: number;
  coveragePct: number;
  confidence: number;
  avgVelocity: number;
  graduatedCorrelation: number;
  growingRepos: RepoVelocity[];
  status: string;
}

export interface VelocityPoint {
  date: string;
  stars: number;
  starVelocity: number;
}

export interface TractionSignals {
  hasStarChart: boolean;
  hasUsedBy: boolean;
  hasDownloadCount: boolean;
  hasGrowthChart: boolean;
  badges: string[];
}

export interface RepoData {
  id: number;
  fullName: string;
  description: string;
  language: string;
  topics: string[];
  zone: string;
  stars: number;
  forks: number;
  heatScore: number;
  velocityHistory: VelocityPoint[];
  tractionSignals: TractionSignals | null;
}

export interface TopicData {
  topic: string;
  repoCount: number;
  risingCount: number;
  breakoutCount: number;
  graduatedCount: number;
  avgVelocity: number;
  isCluster: boolean;
}

export interface GraduatedRepo {
  id: number;
  fullName: string;
  description: string;
  language: string;
  topics: string[];
  finalStars: number;
  finalForks: number;
  graduatedAt: string;
  discoveredAt: string;
}

// --- Data Loaders ---

export async function getStats(): Promise<Stats> {
  return readJSON<Stats>("stats.json");
}

export async function getClusters(): Promise<ClusterAlert[]> {
  return readJSON<ClusterAlert[]>("clusters.json");
}

export async function getRepos(): Promise<RepoData[]> {
  return readJSON<RepoData[]>("repos.json");
}

export async function getTopics(): Promise<TopicData[]> {
  return readJSON<TopicData[]>("topics.json");
}

export async function getGraduated(): Promise<GraduatedRepo[]> {
  return readJSON<GraduatedRepo[]>("graduated.json");
}

export async function getRepoBySlug(slug: string): Promise<RepoData | null> {
  const repos = await getRepos();
  const fullName = slug.replace("-", "/");
  return repos.find((r) => r.fullName.toLowerCase() === fullName.toLowerCase()) ?? null;
}

export async function getTopicByName(topic: string): Promise<{ topic: TopicData | null; repos: RepoData[] }> {
  const [topics, repos] = await Promise.all([getTopics(), getRepos()]);
  const t = topics.find((tt) => tt.topic === topic) ?? null;
  const topicRepos = repos.filter((r) => r.topics?.includes(topic));
  return { topic: t, repos: topicRepos };
}

// --- Scan Report ---

export interface ScanReport {
  generatedAt: string;
  hasPreviousData: boolean;
  narrative: string;
  overview: {
    totalTracked: number;
    prevTracked: number | null;
    newCount: number;
    zoneChangeCount: number;
    topMoverCount: number;
    breakoutCount: number;
    risingCount: number;
    seedlingCount: number;
    scanAt: string;
  };
  newDiscoveries: { fullName: string; description: string; language: string; stars: number; zone: string }[];
  zoneChanges: { fullName: string; from: string; to: string; stars: number; prevStars: number }[];
  topMovers: { fullName: string; starGain: number; stars: number; zone: string; language: string }[];
  trendingTopics: { topic: string; repoCount: number; risingCount: number; breakoutCount: number; avgVelocity: number }[];
  topLanguages: { language: string; count: number; pct: number }[];
}

export async function getReport(): Promise<ScanReport | null> {
  return readJSON<ScanReport>('report.json');
}
