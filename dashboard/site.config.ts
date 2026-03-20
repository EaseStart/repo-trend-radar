/**
 * Site configuration — edit this file after forking the repo.
 * All dashboard features reference this config for dynamic values.
 */

const siteConfig = {
  /** GitHub owner/repo — used for Trigger Scan button, links, etc. */
  githubRepo: process.env.NEXT_PUBLIC_GITHUB_REPO || 'EaseStart/repo-trend-radar',

  /** Site title */
  title: 'Repo Trend Radar',
  description: 'Real-time GitHub intelligence for the next generation of software architects.',

  /** Footer credits — set to null to hide */
  footer: {
    design: { label: 'EaseUI', url: 'https://easeui.design/' },
    ideation: { label: 'EaseStart', url: null },
    developers: 'Jang, Lucius, Barry',
  },
};

export default siteConfig;
