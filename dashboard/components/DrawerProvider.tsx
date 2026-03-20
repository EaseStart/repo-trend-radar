'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface DrawerContextType {
  selectedRepo: string | null;
  openDrawer: (fullName: string) => void;
  closeDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextType>({
  selectedRepo: null,
  openDrawer: () => {},
  closeDrawer: () => {},
});

export function useDrawer() {
  return useContext(DrawerContext);
}

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);

  const openDrawer = useCallback((fullName: string) => {
    setSelectedRepo(fullName);
  }, []);

  const closeDrawer = useCallback(() => {
    setSelectedRepo(null);
  }, []);

  return (
    <DrawerContext.Provider value={{ selectedRepo, openDrawer, closeDrawer }}>
      {children}
    </DrawerContext.Provider>
  );
}
