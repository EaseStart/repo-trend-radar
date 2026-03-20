'use client';

import { useDrawer } from './DrawerProvider';
import type { ReactNode, MouseEvent } from 'react';

interface RepoLinkProps {
  fullName: string;
  children: ReactNode;
  className?: string;
}

export default function RepoLink({ fullName, children, className = '' }: RepoLinkProps) {
  const { openDrawer } = useDrawer();

  function handleClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    openDrawer(fullName);
  }

  return (
    <button onClick={handleClick} className={`text-left cursor-pointer ${className}`}>
      {children}
    </button>
  );
}
