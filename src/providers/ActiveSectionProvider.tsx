'use client';

import {
  createContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { SectionType } from '@/types/resume';

// =============================================================================
// Context
// =============================================================================

export interface ActiveSectionContextValue {
  activeSectionId: string | null;
  activeSectionType: SectionType | null;
  activeSectionContent: string;
  setActiveSection: (id: string, type: SectionType, content: string) => void;
  clearActiveSection: () => void;
}

export const ActiveSectionContext = createContext<ActiveSectionContextValue | null>(null);

// =============================================================================
// Provider Component
// =============================================================================

interface ActiveSectionProviderProps {
  children: ReactNode;
}

export function ActiveSectionProvider({ children }: ActiveSectionProviderProps) {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [activeSectionType, setActiveSectionType] = useState<SectionType | null>(null);
  const [activeSectionContent, setActiveSectionContent] = useState('');

  const setActiveSection = useCallback(
    (id: string, type: SectionType, content: string) => {
      setActiveSectionId(id);
      setActiveSectionType(type);
      setActiveSectionContent(content);
    },
    []
  );

  const clearActiveSection = useCallback(() => {
    setActiveSectionId(null);
    setActiveSectionType(null);
    setActiveSectionContent('');
  }, []);

  return (
    <ActiveSectionContext.Provider
      value={{
        activeSectionId,
        activeSectionType,
        activeSectionContent,
        setActiveSection,
        clearActiveSection,
      }}
    >
      {children}
    </ActiveSectionContext.Provider>
  );
}
