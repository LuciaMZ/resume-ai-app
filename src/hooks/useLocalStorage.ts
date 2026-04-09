'use client';

import { useState, useEffect, useCallback } from 'react';
import { getStorageItem, setStorageItem } from '@/lib/storage';

/**
 * Generic hook that syncs a value with localStorage.
 *
 * - On mount, reads from localStorage (falls back to `initialValue` if absent).
 * - On setValue, writes to both React state and localStorage.
 * - Handles SSR safety (no `window` on server).
 *
 * @param key - localStorage key
 * @param initialValue - Fallback value if nothing is stored
 *
 * @example
 * ```tsx
 * const [theme, setTheme] = useLocalStorage('resumeAIapp:settings', { dark: false });
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Lazy state initializer reads from storage once.
  const [storedValue, setStoredValue] = useState<T>(() => {
    const item = getStorageItem<T>(key);
    return item !== null ? item : initialValue;
  });

  // Write to storage whenever the stored value changes.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const wrote = setStorageItem(key, storedValue);
    if (!wrote) {
      console.error(`[useLocalStorage] Failed to write key "${key}"`);
    }
  }, [key, storedValue]);

  // Setter that supports both direct values and updater functions.
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const nextValue = value instanceof Function ? value(prev) : value;
        return nextValue;
      });
    },
    []
  );

  return [storedValue, setValue];
}
