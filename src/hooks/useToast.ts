'use client';

import { useContext } from 'react';
import { ToastContext, type ToastContextValue } from '@/providers/ToastProvider';

/**
 * Hook to access the toast notification system.
 *
 * Usage:
 *   const { addToast } = useToast();
 *   addToast('Settings saved', 'success');
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
