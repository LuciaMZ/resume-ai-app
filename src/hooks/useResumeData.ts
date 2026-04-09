'use client';

import { useContext } from 'react';
import { ResumeContext, type ResumeContextValue } from '@/providers/ResumeProvider';

/**
 * Access the resume context — provides both the current state and dispatch.
 *
 * Must be used within a <ResumeProvider>.
 *
 * @example
 * ```tsx
 * const { state, dispatch } = useResumeData();
 * dispatch({ type: 'SET_PERSONAL_INFO', payload: { firstName: 'Jane' } });
 * ```
 */
export function useResumeData(): ResumeContextValue {
  const context = useContext(ResumeContext);

  if (!context) {
    throw new Error(
      'useResumeData must be used within a <ResumeProvider>. ' +
        'Wrap your component tree with <ResumeProvider> in layout.tsx.'
    );
  }

  return context;
}
