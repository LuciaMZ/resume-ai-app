'use client';

import { useEffect, useRef } from 'react';
import type { ResumeData } from '@/types/resume';
import { setStorageItem, STORAGE_KEYS } from '@/lib/storage';

/**
 * Debounced auto-save hook.
 *
 * Writes the ResumeData state to localStorage whenever it changes,
 * with a configurable debounce delay (default 500ms).
 *
 * This hook is designed to be used once at a high level (e.g., in page.tsx
 * or a component that wraps the editor). It does NOT trigger re-renders.
 *
 * @param data - The current ResumeData state to persist
 * @param delay - Debounce delay in milliseconds (default: 500)
 */
export function useAutoSave(data: ResumeData, delay: number = 500): void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  const latestDataRef = useRef(data);
  const hasPendingSaveRef = useRef(false);

  latestDataRef.current = data;

  useEffect(() => {
    // Skip the initial mount to avoid an unnecessary write
    // (data was already loaded from localStorage or defaults were saved in Provider)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Clear any pending debounced save
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule a new save
    hasPendingSaveRef.current = true;
    timeoutRef.current = setTimeout(() => {
      setStorageItem(STORAGE_KEYS.RESUME_DATA, latestDataRef.current);
      hasPendingSaveRef.current = false;
      timeoutRef.current = null;
    }, delay);

    // Cleanup on unmount or before next effect
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay]);

  // Ensure data is saved immediately if the component unmounts mid-debounce
  useEffect(() => {
    return () => {
      if (hasPendingSaveRef.current) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        // Flush the latest pending save synchronously on unmount
        setStorageItem(STORAGE_KEYS.RESUME_DATA, latestDataRef.current);
        hasPendingSaveRef.current = false;
      }
    };
  }, []);
}
