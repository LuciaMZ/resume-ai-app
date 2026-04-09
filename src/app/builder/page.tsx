'use client';

import { useState, Suspense, lazy } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Settings, FileDown, Loader2, RotateCcw } from 'lucide-react';
import { ImportButton } from '@/components/import/ImportButton';
import { useResumeData } from '@/hooks/useResumeData';
import { useAutoSave } from '@/hooks/useAutoSave';
import { usePDFExport } from '@/hooks/usePDFExport';
import { useAIConfig } from '@/hooks/useAIConfig';
import { useToast } from '@/hooks/useToast';
import { ResumeEditor } from '@/components/editor/ResumeEditor';
import { ResumePreview } from '@/components/preview/ResumePreview';
import { PreviewControls } from '@/components/preview/PreviewControls';
import { PrintTarget } from '@/components/preview/PrintTarget';
import { AISettingsModal } from '@/components/ai/AISettingsModal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

// Lazy load the AI panel -- only needed when AI is enabled
const AIPanel = lazy(() =>
  import('@/components/ai/AIPanel').then((m) => ({ default: m.AIPanel }))
);

// =============================================================================
// Mobile Tab Types
// =============================================================================

type MobileTab = 'editor' | 'preview' | 'ai';

// =============================================================================
// Builder Page
// =============================================================================

export default function BuilderPage() {
  const { state, dispatch } = useResumeData();
  const { contentRef, handleExport, isExporting } = usePDFExport();
  const { isAIEnabled } = useAIConfig();
  const { addToast } = useToast();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<MobileTab>('editor');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const router = useRouter();

  // Auto-save resume data to localStorage with 500ms debounce
  useAutoSave(state);

  function handleResetResume() {
    dispatch({ type: 'RESET_RESUME' });
    setShowResetConfirm(false);
    addToast('Resume reset to default', 'info');
  }

  function handleExportWithToast() {
    handleExport();
    // The toast fires slightly after the print dialog closes via the hook callback
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface-50">
      {/* ── Hidden Print Target ────────────────────────────────── */}
      <PrintTarget contentRef={contentRef} />

      {/* ── Modals ─────────────────────────────────────────────── */}
      <AISettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <ConfirmDialog
        isOpen={showResetConfirm}
        onConfirm={handleResetResume}
        onCancel={() => setShowResetConfirm(false)}
        title="Reset Resume"
        message="This will clear all your content and start fresh with a blank resume. This action cannot be undone."
        confirmLabel="Reset"
        variant="danger"
      />
      <ConfirmDialog
        isOpen={showLeaveConfirm}
        onConfirm={() => {
          setShowLeaveConfirm(false);
          router.push('/');
        }}
        onCancel={() => setShowLeaveConfirm(false)}
        title="Leave Builder"
        message="All unsaved changes will be lost. Are you sure you want to leave?"
        confirmLabel="Leave Builder"
        variant="danger"
      />

      {/* ── Header / Top Bar ──────────────────────────────────── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-surface-200 bg-white px-4 shadow-sm">
        {/* Logo & App Name */}
        <button
          type="button"
          onClick={() => setShowLeaveConfirm(true)}
          className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1 transition-opacity hover:opacity-80"
          aria-label="Back to home page"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 shadow-sm transition-shadow hover:shadow-md">
            <FileText className="h-4.5 w-4.5 text-white" strokeWidth={2.2} />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-surface-900">
            Resume <span className="text-primary-600">AI APP</span>
          </h1>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Reset Resume */}
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700"
            aria-label="Reset resume"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden md:inline">Reset</span>
          </button>

          {/* Import Resume */}
          <ImportButton />

          {/* Settings */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100 hover:text-surface-900"
            aria-label="AI settings"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
            {/* AI enabled indicator dot */}
            {isAIEnabled && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-green-500 ring-2 ring-white" />
            )}
          </button>

          {/* Separator */}
          <div className="mx-1 hidden h-6 w-px bg-surface-200 sm:block" aria-hidden="true" />

          {/* Export PDF */}
          <button
            type="button"
            onClick={handleExportWithToast}
            disabled={isExporting}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-all duration-150 ${
              isExporting
                ? 'cursor-wait bg-primary-400 text-white'
                : 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-md active:bg-primary-800 active:shadow-sm'
            }`}
            aria-label={isExporting ? 'Exporting PDF...' : 'Export PDF'}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </span>
          </button>
        </div>
      </header>

      {/* ── Main Content: Dynamic 2/3-Panel Layout ─────────────── */}
      <main className="flex min-h-0 flex-1">
        {/* Editor Panel */}
        <section
          className={`panel-scroll border-r border-surface-200 bg-white transition-all duration-300 ease-in-out ${
            isAIEnabled
              ? 'max-lg:flex-1 lg:w-[35%] lg:min-w-[320px]'
              : 'flex-1 lg:max-w-[50%]'
          } ${activeTab === 'editor' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'}`}
          aria-label="Resume editor"
        >
          <div className="mx-auto w-full max-w-2xl px-6 py-8">
            <ResumeEditor />
          </div>
        </section>

        {/* Preview Panel */}
        <section
          className={`flex-col bg-surface-100 transition-all duration-300 ease-in-out ${
            isAIEnabled ? 'max-lg:flex-1 lg:w-[40%]' : 'flex-1'
          } ${activeTab === 'preview' ? 'flex' : 'hidden lg:flex'}`}
          aria-label="Resume preview"
        >
          <PreviewControls zoomLevel={zoomLevel} onZoomChange={setZoomLevel} />
          <div className="min-h-0 flex-1">
            <ResumePreview zoomLevel={zoomLevel} />
          </div>
        </section>

        {/* AI Panel (conditional) */}
        {isAIEnabled && (
          <section
            className={`border-l border-surface-200 bg-surface-50 transition-all duration-300 ease-in-out max-lg:flex-1 lg:flex lg:w-[25%] lg:min-w-[280px] lg:flex-col ${
              activeTab === 'ai' ? 'flex flex-col' : 'hidden'
            }`}
            aria-label="AI suggestions"
          >
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
                </div>
              }
            >
              <AIPanel />
            </Suspense>
          </section>
        )}
      </main>

      {/* ── Mobile Tab Bar (visible below lg) ──────────────────── */}
      <nav
        className="flex shrink-0 border-t border-surface-200 bg-white lg:hidden"
        role="tablist"
        aria-label="View selection"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'editor'}
          onClick={() => setActiveTab('editor')}
          className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
            activeTab === 'editor'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-surface-500 hover:text-surface-700'
          }`}
        >
          Editor
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'preview'}
          onClick={() => setActiveTab('preview')}
          className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
            activeTab === 'preview'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-surface-500 hover:text-surface-700'
          }`}
        >
          Preview
        </button>
        {isAIEnabled && (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'ai'}
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
              activeTab === 'ai'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            AI
          </button>
        )}
      </nav>
    </div>
  );
}
