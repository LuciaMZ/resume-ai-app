'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

// =============================================================================
// ConfirmDialog
// =============================================================================

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'default';
}

export function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel = 'Delete',
  variant = 'danger',
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus the confirm button when the dialog opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to allow the DOM to update
      const timer = setTimeout(() => confirmRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCancel();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  // Trap focus inside the dialog
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;

    const dialog = dialogRef.current;
    const focusableElements = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstEl = focusableElements[0];
    const lastEl = focusableElements[focusableElements.length - 1];

    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl?.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl?.focus();
        }
      }
    }

    dialog.addEventListener('keydown', handleTab);
    return () => dialog.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  if (!isOpen) return null;

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onCancel();
  }

  const isDanger = variant === 'danger';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in" />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 fade-in"
      >
        <div className="px-6 pt-6 pb-4">
          {/* Icon + Title */}
          <div className="flex items-start gap-3">
            {isDanger && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-base font-semibold text-surface-900">
                {title}
              </h3>
              <p className="mt-1.5 text-sm text-surface-500 leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-surface-100 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm ${
              isDanger
                ? 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800'
                : 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
