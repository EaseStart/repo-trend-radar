import type { Metadata } from 'next';
import './globals.css';
import ClientLayout from '@/components/ClientLayout';
import { getRepos } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Repo Trend Radar | 2026 Tech Intelligence',
  description: 'Real-time GitHub intelligence for the next generation of software architects.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const repos = await getRepos();

  // Build metadata map for the drawer
  const reposMeta: Record<string, { description: string; language: string; zone: string; stars: number; forks: number; heatScore: number; topics: string[] }> = {};
  for (const r of repos) {
    reposMeta[r.fullName] = {
      description: r.description,
      language: r.language,
      zone: r.zone,
      stars: r.stars,
      forks: r.forks,
      heatScore: r.heatScore,
      topics: r.topics,
    };
  }

  return (
    <html lang="en">
      <body className="min-h-screen">
        <ClientLayout reposMeta={reposMeta}>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
