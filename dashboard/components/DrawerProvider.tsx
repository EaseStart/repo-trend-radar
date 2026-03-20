'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface DrawerContextType {
  selectedRepo: string | null;
  repoList: string[];
  currentIndex: number;
  openDrawer: (fullName: string, list?: string[]) => void;
  closeDrawer: () => void;
  goNext: () => boolean;
  goPrev: () => boolean;
  hasNext: boolean;
  hasPrev: boolean;
}

const DrawerContext = createContext<DrawerContextType>({
  selectedRepo: null,
  repoList: [],
  currentIndex: -1,
  openDrawer: () => {},
  closeDrawer: () => {},
  goNext: () => false,
  goPrev: () => false,
  hasNext: false,
  hasPrev: false,
});

export function useDrawer() {
  return useContext(DrawerContext);
}

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [repoList, setRepoList] = useState<string[]>([]);

  const currentIndex = selectedRepo ? repoList.indexOf(selectedRepo) : -1;
  const hasNext = currentIndex >= 0 && currentIndex < repoList.length - 1;
  const hasPrev = currentIndex > 0;

  const openDrawer = useCallback((fullName: string, list?: string[]) => {
    if (list) setRepoList(list);
    setSelectedRepo(fullName);
  }, []);

  const closeDrawer = useCallback(() => {
    setSelectedRepo(null);
  }, []);

  const goNext = useCallback(() => {
    if (!selectedRepo) return false;
    const idx = repoList.indexOf(selectedRepo);
    if (idx >= 0 && idx < repoList.length - 1) {
      setSelectedRepo(repoList[idx + 1]);
      return true;
    }
    return false;
  }, [selectedRepo, repoList]);

  const goPrev = useCallback(() => {
    if (!selectedRepo) return false;
    const idx = repoList.indexOf(selectedRepo);
    if (idx > 0) {
      setSelectedRepo(repoList[idx - 1]);
      return true;
    }
    return false;
  }, [selectedRepo, repoList]);

  return (
    <DrawerContext.Provider value={{
      selectedRepo, repoList, currentIndex, openDrawer, closeDrawer,
      goNext, goPrev, hasNext, hasPrev,
    }}>
      {children}
    </DrawerContext.Provider>
  );
}
