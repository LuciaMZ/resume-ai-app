'use client';

import {
  createContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { generateId } from '@/lib/uuid';
import { subscribeToStorageErrors } from '@/lib/storage';

// =============================================================================
// Types
// =============================================================================

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration: number;
}

export interface ToastContextValue {
  addToast: (message: string, type?: Toast['type'], duration?: number) => void;
}

// =============================================================================
// Context
// =============================================================================

export const ToastContext = createContext<ToastContextValue | null>(null);

// =============================================================================
// Provider
// =============================================================================

const MAX_TOASTS = 3;
const DEFAULT_DURATION = 3000;

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (
      message: string,
      type: Toast['type'] = 'success',
      duration: number = DEFAULT_DURATION
    ) => {
      const id = generateId();
      const toast: Toast = { id, message, type, duration };

      setToasts((prev) => {
        const next = [...prev, toast];
        // Keep only the most recent MAX_TOASTS
        if (next.length > MAX_TOASTS) {
          return next.slice(next.length - MAX_TOASTS);
        }
        return next;
      });

      // Auto-dismiss after duration
      setTimeout(() => removeToast(id), duration);
    },
    [removeToast]
  );

  useEffect(() => {
    return subscribeToStorageErrors((error) => {
      if (error.operation !== 'write' && error.operation !== 'remove') {
        return;
      }

      addToast(
        'Could not save changes to browser storage. Your data may not persist if this continues.',
        'error'
      );
    });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      {/* Toast Container */}
      {toasts.length > 0 && (
        <div
          className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2"
          aria-live="polite"
          aria-label="Notifications"
        >
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onDismiss={() => removeToast(toast.id)}
            />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

// =============================================================================
// Toast Item
// =============================================================================

interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const bgClass =
    toast.type === 'error'
      ? 'bg-red-600'
      : toast.type === 'info'
        ? 'bg-surface-700'
        : 'bg-green-600';

  const iconPath =
    toast.type === 'error'
      ? 'M12 9v4m0 4h.01M12 2a10 10 0 110 20 10 10 0 010-20z'
      : toast.type === 'info'
        ? 'M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 110 20 10 10 0 010-20z'
        : 'M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z';

  return (
    <div
      className={`toast-enter flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${bgClass}`}
      role="status"
    >
      <svg
        className="h-4 w-4 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={iconPath} />
      </svg>
      <span className="flex-1">{toast.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded p-0.5 transition-opacity hover:opacity-80"
        aria-label="Dismiss notification"
      >
        <svg
          className="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
