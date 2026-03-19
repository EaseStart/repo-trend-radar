import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Repo Trend Radar — Detect Emerging Open-Source Ecosystems",
  description: "Automated detection of technology trend clusters by analyzing GitHub repository growth signals across topics.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen">
        <nav className="border-b border-[#30363d] bg-[var(--bg-secondary)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <Link href="/" className="flex items-center gap-2 font-semibold text-[var(--text-primary)] hover:no-underline">
                <span className="text-xl">📡</span>
                <span>Repo Trend Radar</span>
              </Link>
              <div className="flex items-center gap-6 text-sm">
                <Link href="/clusters" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors hover:no-underline">Clusters</Link>
                <Link href="/graduated" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors hover:no-underline">Graduated</Link>
                <a href="https://github.com/easestart/repo-trend-radar" target="_blank" rel="noopener" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors hover:no-underline">GitHub</a>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-[#30363d] py-6 text-center text-xs text-[var(--text-muted)]">
          Built by <a href="https://github.com/easestart" target="_blank" rel="noopener">EaseStart</a> · Powered by GitHub API
        </footer>
      </body>
    </html>
  );
}
