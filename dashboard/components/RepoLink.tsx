'use client';

import { useDrawer } from './DrawerProvider';
import type { ReactNode, MouseEvent } from 'react';

interface RepoLinkProps {
  fullName: string;
  children: ReactNode;
  className?: string;
  repoList?: string[];
}

export default function RepoLink({ fullName, children, className = '', repoList }: RepoLinkProps) {
  const { openDrawer } = useDrawer();

  function handleClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    openDrawer(fullName, repoList);
  }

  return (
    <button onClick={handleClick} className={`w-full text-left cursor-pointer ${className}`}>
      {children}
    </button>
  );
}
