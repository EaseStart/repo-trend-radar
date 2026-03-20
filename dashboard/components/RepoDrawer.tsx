'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { X, ExternalLink, Star, GitFork, Flame, Tag, Copy, Check, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
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
  const { selectedRepo, closeDrawer, goNext, goPrev, hasNext, hasPrev, currentIndex, repoList } = useDrawer();
  const [readme, setReadme] = useState<string | null>(null);
  const [readmeLoading, setReadmeLoading] = useState(false);
  const [readmeError, setReadmeError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showNextHint, setShowNextHint] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const scrollCooldownRef = useRef(false);

  const meta = selectedRepo ? reposMeta[selectedRepo] : null;
  const githubUrl = selectedRepo ? `https://github.com/${selectedRepo}` : '';

  // Fetch README
  useEffect(() => {
    if (!selectedRepo) return;
    setReadme(null);
    setReadmeLoading(true);
    setReadmeError(false);
    setShowNextHint(false);

    // Scroll to top when switching repos
    if (scrollRef.current) scrollRef.current.scrollTop = 0;

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

  // Scroll-to-bottom detection for TikTok-style navigation
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let overscrollCount = 0;

    function handleScroll() {
      const { scrollTop, scrollHeight, clientHeight } = container!;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 20;

      if (atBottom && hasNext && !readmeLoading) {
        setShowNextHint(true);
      } else {
        setShowNextHint(false);
        overscrollCount = 0;
      }
    }

    function handleWheel(e: WheelEvent) {
      const { scrollTop, scrollHeight, clientHeight } = container!;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 5;
      const atTop = scrollTop <= 5;

      // Scrolling down past bottom → go next
      if (atBottom && e.deltaY > 15 && hasNext && !scrollCooldownRef.current && !readmeLoading) {
        overscrollCount++;
        if (overscrollCount >= 2) {
          scrollCooldownRef.current = true;
          goNext();
          overscrollCount = 0;
          setTimeout(() => { scrollCooldownRef.current = false; }, 500);
        }
      }
      // Scrolling up past top → go prev
      else if (atTop && e.deltaY < -15 && hasPrev && !scrollCooldownRef.current && !readmeLoading) {
        overscrollCount++;
        if (overscrollCount >= 2) {
          scrollCooldownRef.current = true;
          goPrev();
          overscrollCount = 0;
          setTimeout(() => { scrollCooldownRef.current = false; }, 500);
        }
      }
      else if (!atBottom && !atTop) {
        overscrollCount = 0;
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [hasNext, hasPrev, goNext, goPrev, readmeLoading]);

  // Close on Escape, arrow key nav
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') closeDrawer();
    if (e.key === 'ArrowDown' && e.metaKey && hasNext) { e.preventDefault(); goNext(); }
    if (e.key === 'ArrowUp' && e.metaKey && hasPrev) { e.preventDefault(); goPrev(); }
  }, [closeDrawer, goNext, goPrev, hasNext, hasPrev]);

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
  const nextRepo = hasNext ? repoList[currentIndex + 1] : null;
  const prevRepo = hasPrev ? repoList[currentIndex - 1] : null;

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
                <div className="min-w-0">
                  <span className="text-sm font-bold text-slate-900 truncate block">{selectedRepo}</span>
                  {repoList.length > 1 && (
                    <span className="text-xs text-slate-400">{currentIndex + 1} / {repoList.length}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Nav arrows */}
                {repoList.length > 1 && (
                  <>
                    <button
                      onClick={() => goPrev()}
                      disabled={!hasPrev}
                      className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                      title="Previous repo (⌘↑)"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => goNext()}
                      disabled={!hasNext}
                      className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                      title="Next repo (⌘↓)"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </>
                )}
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

            {/* README — scrollable area with TikTok-style navigation */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 scroll-smooth">
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
                  prose-pre:bg-slate-900 prose-pre:rounded-xl prose-pre:text-xs
                  [&_pre_code]:bg-transparent [&_pre_code]:text-slate-100 [&_pre_code]:p-0
                  prose-img:rounded-xl prose-img:max-w-full
                  prose-table:text-xs
                  prose-th:bg-slate-50 prose-th:p-2
                  prose-td:p-2
                ">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{readme}</ReactMarkdown>
                </article>
              )}

              {/* Next repo hint at bottom */}
              {hasNext && nextRepo && !readmeLoading && readme && (
                <div ref={bottomSentinelRef} className="mt-8 pt-6 border-t border-dashed border-[#E2E8F0]">
                  <div className={`flex flex-col items-center gap-2 transition-all duration-300 ${showNextHint ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-1'}`}>
                    <ChevronDown className={`w-5 h-5 text-[#007AFF] ${showNextHint ? 'animate-bounce' : ''}`} />
                    <p className="text-xs text-slate-400 text-center">
                      Keep scrolling for next
                    </p>
                    <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-[#E2E8F0]">
                      <img
                        src={`https://github.com/${nextRepo.split('/')[0]}.png`}
                        className="w-5 h-5 rounded-md bg-slate-100"
                        alt=""
                      />
                      <span className="text-xs font-semibold text-slate-700">{nextRepo}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Previous repo hint at top (shown when at top) */}
              {!hasNext && !hasPrev && !readmeLoading && readme && (
                <div className="mt-8 text-center">
                  <p className="text-xs text-slate-300">End of list</p>
                </div>
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
