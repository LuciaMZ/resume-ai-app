'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Loader2, AlertCircle, RotateCcw, Settings } from 'lucide-react';
import { useResumeData } from '@/hooks/useResumeData';
import { useAIConfig } from '@/hooks/useAIConfig';
import { useToast } from '@/hooks/useToast';
import { importResumeFromPDF } from '@/lib/import';
import type { ImportProgress, ImportResult } from '@/lib/import';
import type { ResumeData } from '@/types/resume';
import { FileDropZone } from './FileDropZone';
import { ImportPreview } from './ImportPreview';

// =============================================================================
// ImportModal
// =============================================================================

type ModalStep =
  | 'file-select'
  | 'processing'
  | 'preview'
  | 'confirm-overwrite'
  | 'complete'
  | 'error';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Import modal component. Because ImportButton conditionally renders this
 * component only when isOpen is true (`{isOpen && <ImportModal .../>}`),
 * the component remounts with fresh state each time the modal opens.
 * No state reset logic is needed in useEffect.
 */
export function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const { state, dispatch } = useResumeData();
  const { aiConfig, isAIEnabled } = useAIConfig();
  const { addToast } = useToast();

  const [step, setStep] = useState<ModalStep>('file-select');
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // ── Save trigger element on mount and restore focus on unmount ──────────
  useEffect(() => {
    triggerRef.current = document.activeElement as HTMLElement;

    return () => {
      // Abort any in-progress import
      abortRef.current?.abort();
      abortRef.current = null;
      // Return focus to the element that was active when the modal opened
      triggerRef.current?.focus();
    };
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleClose = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    onClose();
  }, [onClose]);

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) handleClose();
  }

  // ── Escape to close ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        handleClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // ── Focus trap ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;
    const dialog = dialogRef.current;

    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const focusableElements = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstEl = focusableElements[0];
      const lastEl = focusableElements[focusableElements.length - 1];

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
  }, [isOpen, step]);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setError(null);
  }, []);

  async function handleStartImport() {
    if (!selectedFile || !aiConfig) return;

    const activeProviderConfig = aiConfig.providers[aiConfig.activeProvider];
    if (!activeProviderConfig?.apiKey) return;

    setStep('processing');
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const importResult = await importResumeFromPDF(
        selectedFile,
        {
          apiKey: activeProviderConfig.apiKey,
          model: activeProviderConfig.model,
          provider: aiConfig.activeProvider,
        },
        (p) => setProgress(p),
        controller.signal
      );

      setResult(importResult);
      setStep('preview');
    } catch (err) {
      if (controller.signal.aborted) return; // User cancelled

      const message =
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred during import.';
      setError(message);
      setStep('error');
    }
  }

  function handleConfirmPreview() {
    // Check if current resume has meaningful content
    if (isResumeEmpty(state)) {
      applyImport();
    } else {
      setStep('confirm-overwrite');
    }
  }

  function applyImport() {
    if (!result) return;

    // Apply withUpdatedTimestamp equivalent since LOAD_RESUME doesn't do it
    const dataWithTimestamp: ResumeData = {
      ...result.data,
      meta: {
        ...result.data.meta,
        updatedAt: new Date().toISOString(),
      },
    };

    dispatch({ type: 'LOAD_RESUME', payload: dataWithTimestamp });
    addToast('Resume imported successfully!', 'success');
    setStep('complete');
    // Close modal after a brief delay to show the success state
    setTimeout(() => onClose(), 400);
  }

  function handleRetry() {
    // If we still have the file, go back to processing
    if (selectedFile) {
      handleStartImport();
    } else {
      setStep('file-select');
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Import Resume from PDF"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in" />

      {/* Modal */}
      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 fade-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-surface-900">
              Import Resume
            </h2>
            <p className="mt-0.5 text-sm text-surface-500">
              {step === 'file-select' && 'Upload a PDF to import your resume'}
              {step === 'processing' && 'Processing your resume...'}
              {step === 'preview' && 'Review the extracted data'}
              {step === 'confirm-overwrite' && 'Confirm import'}
              {step === 'error' && 'Something went wrong'}
              {step === 'complete' && 'Import complete'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600"
            aria-label="Close import dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* AI Not Configured */}
          {!isAIEnabled && step === 'file-select' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <Settings className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    AI configuration required
                  </p>
                  <p className="mt-1 text-sm text-amber-700">
                    Resume import uses AI to parse your PDF. Please configure an AI
                    provider in Settings first.
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Step 1: File Selection */}
          {isAIEnabled && step === 'file-select' && (
            <div className="space-y-4">
              <FileDropZone onFileSelect={handleFileSelect} />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStartImport}
                  disabled={!selectedFile}
                  className={`rounded-lg px-5 py-2 text-sm font-medium transition-all duration-150 ${
                    selectedFile
                      ? 'bg-primary-600 text-white shadow-sm hover:bg-primary-700 hover:shadow-md active:bg-primary-800'
                      : 'cursor-not-allowed bg-surface-100 text-surface-400'
                  }`}
                >
                  Start Import
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Processing */}
          {step === 'processing' && (
            <div className="space-y-5">
              <div className="flex flex-col items-center py-6">
                <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
                <p className="mt-4 text-sm font-medium text-surface-700">
                  {getProcessingLabel(progress?.step)}
                </p>
                {progress?.message && (
                  <p className="mt-1 text-xs text-surface-400">
                    {progress.message}
                  </p>
                )}
              </div>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && result && (
            <ImportPreview
              data={result.data}
              onConfirm={handleConfirmPreview}
              onCancel={handleClose}
            />
          )}

          {/* Step 4: Confirm Overwrite */}
          {step === 'confirm-overwrite' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-surface-900">
                    Replace existing resume?
                  </h3>
                  <p className="mt-1.5 text-sm text-surface-500 leading-relaxed">
                    Importing will replace your current resume data. This action
                    cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('preview')}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={applyImport}
                  className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-primary-700 hover:shadow-md active:bg-primary-800"
                >
                  Replace & Import
                </button>
              </div>
            </div>
          )}

          {/* Error State */}
          {step === 'error' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Import failed
                  </p>
                  <p className="mt-1 text-sm text-red-700">
                    {error || 'An unexpected error occurred.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-primary-700 hover:shadow-md active:bg-primary-800"
                >
                  <RotateCcw className="h-4 w-4" />
                  Retry
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

/** Map the import pipeline step to a user-friendly label */
function getProcessingLabel(step?: string): string {
  switch (step) {
    case 'uploading':
      return 'Step 1 of 2: Validating file...';
    case 'extracting':
      return 'Step 1 of 2: Extracting text from PDF...';
    case 'parsing':
      return 'Step 2 of 2: Analyzing with AI...';
    case 'validating':
      return 'Step 2 of 2: Validating data...';
    default:
      return 'Processing...';
  }
}

/**
 * Heuristic: consider a resume "empty" if it has no personal info filled
 * and all sections are default (same as createDefaultResumeData).
 */
function isResumeEmpty(state: ResumeData): boolean {
  const { personalInfo } = state;
  const hasPersonalInfo =
    personalInfo.firstName.trim() ||
    personalInfo.lastName.trim() ||
    personalInfo.email.trim() ||
    personalInfo.phone.trim();

  return !hasPersonalInfo;
}
