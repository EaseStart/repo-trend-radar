'use client';

import { DrawerProvider } from '@/components/DrawerProvider';
import RepoDrawer from '@/components/RepoDrawer';
import Sidebar from '@/components/Sidebar';
import type { ReactNode } from 'react';

interface ClientLayoutProps {
  children: ReactNode;
  reposMeta: Record<string, { description: string; language: string; zone: string; stars: number; forks: number; heatScore: number; topics: string[] }>;
}

export default function ClientLayout({ children, reposMeta }: ClientLayoutProps) {
  return (
    <DrawerProvider>
      <Sidebar />
      <main className="flex-1 ml-[88px] bg-[#F8FAFC] min-h-screen">
        {children}
      </main>
      <RepoDrawer reposMeta={reposMeta} />
    </DrawerProvider>
  );
}
