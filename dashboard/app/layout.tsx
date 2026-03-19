import type { Metadata } from 'next';
import { Inter, IBM_Plex_Mono, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const ibmPlexMono = IBM_Plex_Mono({ weight: ['400', '500', '600', '700'], subsets: ['latin'], variable: '--font-mono' });
const jetbrainsMono = JetBrains_Mono({ weight: ['400', '500'], subsets: ['latin'], variable: '--font-data' });

export const metadata: Metadata = {
  title: 'Repo Trend Radar | 2026 Tech Intelligence',
  description: 'Real-time GitHub intelligence for the next generation of software architects.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${ibmPlexMono.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-[88px] bg-[#F8FAFC] min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
