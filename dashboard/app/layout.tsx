import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'Repo Trend Radar | 2026 Tech Intelligence',
  description: 'Real-time GitHub intelligence for the next generation of software architects.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-[88px] bg-[#F8FAFC] min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
