'use client';

import { useContext } from 'react';
import {
  ActiveSectionContext,
  type ActiveSectionContextValue,
} from '@/providers/ActiveSectionProvider';

/**
 * Access the active section context for focus tracking.
 *
 * Must be used within an <ActiveSectionProvider>.
 */
export function useActiveSection(): ActiveSectionContextValue {
  const context = useContext(ActiveSectionContext);

  if (!context) {
    throw new Error(
      'useActiveSection must be used within an <ActiveSectionProvider>. ' +
        'Wrap your component tree with <ActiveSectionProvider> in layout.tsx.'
    );
  }

  return context;
}
