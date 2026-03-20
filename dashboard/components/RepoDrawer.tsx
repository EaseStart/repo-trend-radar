'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, ExternalLink, Star, GitFork, Flame, Tag, Copy, Check, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useDrawer } from './DrawerProvider';

const ZONE_BADGE: Record<string, string> = {
  breakout: 'text-[#F59E0B] bg-[#F59E0B]/10',
  rising:   'text-[#007AFF] bg-[#007AFF]/10',
  seedling: 'text-slate-500 bg-slate-100',
  graduated: 'text-[#22C55E] bg-[#22C55E]/10',
};

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5',
  Rust: '#dea584', Go: '#00ADD8', Java: '#b07219', 'C++': '#f34b7d',
  Ruby: '#701516', Swift: '#F05138', Kotlin: '#A97BFF', Elixir: '#6e4a7e',
  Zig: '#ec915c', Lua: '#000080', PHP: '#4F5D95', HTML: '#e34c26',
};

interface RepoMeta {
  description: string;
  language: string;
  zone: string;
  stars: number;
  forks: number;
  heatScore: number;
  topics: string[];
}

export default function RepoDrawer({ reposMeta }: { reposMeta: Record<string, RepoMeta> }) {
  const { selectedRepo, closeDrawer } = useDrawer();
  const [readme, setReadme] = useState<string | null>(null);
  const [readmeLoading, setReadmeLoading] = useState(false);
  const [readmeError, setReadmeError] = useState(false);
  const [copied, setCopied] = useState(false);

  const meta = selectedRepo ? reposMeta[selectedRepo] : null;
  const githubUrl = selectedRepo ? `https://github.com/${selectedRepo}` : '';

  // Fetch README
  useEffect(() => {
    if (!selectedRepo) return;
    setReadme(null);
    setReadmeLoading(true);
    setReadmeError(false);

    fetch(`https://raw.githubusercontent.com/${selectedRepo}/HEAD/README.md`)
      .then(res => {
        if (!res.ok) throw new Error('not found');
        return res.text();
      })
      .then(text => {
        setReadme(text);
        setReadmeLoading(false);
      })
      .catch(() => {
        setReadmeError(true);
        setReadmeLoading(false);
      });
  }, [selectedRepo]);

  // Close on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') closeDrawer();
  }, [closeDrawer]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Copy URL
  function copyUrl() {
    navigator.clipboard.writeText(githubUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isOpen = !!selectedRepo;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-[520px] max-w-[90vw] bg-white border-l border-[#E2E8F0] z-50 shadow-2xl shadow-black/10 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedRepo && (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between bg-slate-50/50 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <img
                  src={`https://github.com/${selectedRepo.split('/')[0]}.png`}
                  className="w-8 h-8 rounded-lg bg-slate-100 border border-[#E2E8F0] flex-shrink-0"
                  alt="Avatar"
                />
                <span className="text-sm font-bold text-slate-900 truncate">{selectedRepo}</span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={copyUrl}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-all"
                  title="Copy URL"
                >
                  {copied ? <Check className="w-4 h-4 text-[#22C55E]" /> : <Copy className="w-4 h-4" />}
                </button>
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener"
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-all"
                  title="Open on GitHub"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={closeDrawer}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Meta section */}
            {meta && (
              <div className="px-5 py-4 border-b border-[#E2E8F0] space-y-3 flex-shrink-0">
                {meta.description && (
                  <p className="text-sm text-slate-600 leading-relaxed">{meta.description}</p>
                )}

                {/* Stats row */}
                <div className="flex items-center gap-4 flex-wrap">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${ZONE_BADGE[meta.zone] || 'text-slate-400 bg-slate-100'}`}>
                    {meta.zone.toUpperCase()}
                  </span>
                  {meta.language && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: LANG_COLORS[meta.language] || '#8b949e' }} />
                      {meta.language}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Star className="w-3 h-3 text-amber-400" /> {meta.stars.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <GitFork className="w-3 h-3" /> {meta.forks.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Flame className="w-3 h-3" style={{ color: meta.heatScore >= 0.5 ? '#F59E0B' : '#94A3B8' }} /> {meta.heatScore.toFixed(2)}
                  </span>
                </div>

                {/* Topics */}
                {meta.topics && meta.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    <Tag className="w-3 h-3 text-slate-400 mt-0.5" />
                    {meta.topics.slice(0, 10).map(t => (
                      <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        {t}
                      </span>
                    ))}
                    {meta.topics.length > 10 && (
                      <span className="text-xs text-slate-400">+{meta.topics.length - 10}</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* README */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {readmeLoading && (
                <div className="flex items-center justify-center py-12 gap-2">
                  <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                  <span className="text-sm text-slate-400">Loading README...</span>
                </div>
              )}
              {readmeError && (
                <div className="text-center py-12">
                  <p className="text-sm text-slate-400">No README found</p>
                </div>
              )}
              {readme && (
                <article className="prose prose-sm prose-slate max-w-none
                  prose-headings:text-slate-900 prose-headings:font-bold
                  prose-h1:text-xl prose-h1:border-b prose-h1:border-[#E2E8F0] prose-h1:pb-2
                  prose-h2:text-lg prose-h3:text-base
                  prose-a:text-[#007AFF] prose-a:no-underline hover:prose-a:underline
                  prose-code:text-xs prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
                  prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-xl prose-pre:text-xs
                  prose-img:rounded-xl prose-img:max-w-full
                  prose-table:text-xs
                  prose-th:bg-slate-50 prose-th:p-2
                  prose-td:p-2
                ">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{readme}</ReactMarkdown>
                </article>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-[#E2E8F0] bg-slate-50/50 flex items-center gap-2 flex-shrink-0">
              <button
                onClick={copyUrl}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold border border-[#E2E8F0] rounded-xl hover:bg-slate-100 transition-colors text-slate-700"
              >
                {copied ? <><Check className="w-3.5 h-3.5 text-[#22C55E]" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy URL</>}
              </button>
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Open on GitHub <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
