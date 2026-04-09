'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { AISuggestion } from '@/types/ai';
import { useAIConfig } from '@/hooks/useAIConfig';
import { useActiveSection } from '@/hooks/useActiveSection';
import { generateSuggestions, AIError } from '@/lib/ai';

// =============================================================================
// useAISuggestions Hook
// =============================================================================

export interface UseAISuggestionsReturn {
  suggestions: AISuggestion[];
  isLoading: boolean;
  error: string | null;
  fetchSuggestions: () => void;
  clearSuggestions: () => void;
}

/**
 * Hook that manages fetching and state of AI suggestions.
 *
 * Reads from AIProvider (config) and ActiveSectionProvider (current section).
 * Suggestions are NOT auto-fetched -- the user triggers via fetchSuggestions().
 * Suggestions are cleared when the active section changes.
 */
export function useAISuggestions(): UseAISuggestionsReturn {
  const { aiConfig } = useAIConfig();
  const { activeSectionId, activeSectionType, activeSectionContent } =
    useActiveSection();

  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the section ID to clear suggestions when it changes
  const prevSectionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (prevSectionIdRef.current !== activeSectionId) {
      prevSectionIdRef.current = activeSectionId;
      setSuggestions([]);
      setError(null);
    }
  }, [activeSectionId]);

  const fetchSuggestions = useCallback(async () => {
    if (!aiConfig || !activeSectionId || !activeSectionType) {
      setError('Select a section to get AI suggestions.');
      return;
    }

    const content = activeSectionContent.trim();
    if (!content) {
      setError('Start typing in a section to get AI suggestions.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      const results = await generateSuggestions(
        aiConfig,
        activeSectionType,
        content
      );

      // Attach the section ID to each suggestion
      const withSectionId = results.map((s) => ({
        ...s,
        sectionId: activeSectionId,
      }));

      setSuggestions(withSectionId);
    } catch (err) {
      if (err instanceof AIError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [aiConfig, activeSectionId, activeSectionType, activeSectionContent]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    fetchSuggestions,
    clearSuggestions,
  };
}
