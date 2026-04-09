'use client';

import {
  createContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { AIConfig, ProviderConfig } from '@/types/ai';
import { getStorageItem, setStorageItem, removeStorageItem, STORAGE_KEYS } from '@/lib/storage';
import { migrateAIConfig } from '@/lib/ai';

// =============================================================================
// Context
// =============================================================================

export interface AIContextValue {
  aiConfig: AIConfig | null;
  isAIEnabled: boolean;
  setProviderConfig: (providerId: string, config: ProviderConfig) => void;
  setActiveProvider: (providerId: string) => void;
  clearProviderConfig: (providerId: string) => void;
}

export const AIContext = createContext<AIContextValue | null>(null);

// =============================================================================
// Provider Component
// =============================================================================

interface AIProviderProps {
  children: ReactNode;
}

export function AIProvider({ children }: AIProviderProps) {
  const [aiConfig, setAIConfigState] = useState<AIConfig | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load and migrate config from localStorage on mount
  useEffect(() => {
    const stored = getStorageItem<unknown>(STORAGE_KEYS.AI_CONFIG);
    const migrated = migrateAIConfig(stored);
    if (migrated) {
      setAIConfigState(migrated);
      // Persist migrated format back to storage
      setStorageItem(STORAGE_KEYS.AI_CONFIG, migrated);
    }
    setIsHydrated(true);
  }, []);

  const persist = useCallback((config: AIConfig) => {
    setAIConfigState(config);
    setStorageItem(STORAGE_KEYS.AI_CONFIG, config);
  }, []);

  const setProviderConfig = useCallback(
    (providerId: string, config: ProviderConfig) => {
      const current = aiConfig ?? { activeProvider: providerId, providers: {} };
      const updated: AIConfig = {
        ...current,
        activeProvider: providerId,
        providers: {
          ...current.providers,
          [providerId]: config,
        },
      };
      persist(updated);
    },
    [aiConfig, persist]
  );

  const setActiveProvider = useCallback(
    (providerId: string) => {
      if (!aiConfig) return;
      persist({ ...aiConfig, activeProvider: providerId });
    },
    [aiConfig, persist]
  );

  const clearProviderConfig = useCallback(
    (providerId: string) => {
      if (!aiConfig) return;
      const { [providerId]: _, ...remaining } = aiConfig.providers;
      const hasRemaining = Object.keys(remaining).length > 0;

      if (!hasRemaining) {
        setAIConfigState(null);
        removeStorageItem(STORAGE_KEYS.AI_CONFIG);
        return;
      }

      const newActive =
        aiConfig.activeProvider === providerId
          ? Object.keys(remaining)[0]
          : aiConfig.activeProvider;

      persist({
        activeProvider: newActive,
        providers: remaining,
      });
    },
    [aiConfig, persist]
  );

  const activeProviderConfig = aiConfig?.providers[aiConfig.activeProvider];
  const isAIEnabled =
    isHydrated &&
    aiConfig !== null &&
    !!activeProviderConfig?.apiKey &&
    activeProviderConfig.apiKey.length > 0;

  return (
    <AIContext.Provider
      value={{
        aiConfig,
        isAIEnabled,
        setProviderConfig,
        setActiveProvider,
        clearProviderConfig,
      }}
    >
      {children}
    </AIContext.Provider>
  );
}
