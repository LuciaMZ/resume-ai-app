'use client';

import { useContext } from 'react';
import { AIContext, type AIContextValue } from '@/providers/AIProvider';

/**
 * Access the AI configuration context.
 *
 * Must be used within an <AIProvider>.
 */
export function useAIConfig(): AIContextValue {
  const context = useContext(AIContext);

  if (!context) {
    throw new Error(
      'useAIConfig must be used within an <AIProvider>. ' +
        'Wrap your component tree with <AIProvider> in layout.tsx.'
    );
  }

  return context;
}
