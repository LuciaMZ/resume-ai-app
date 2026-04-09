'use client';

import { useState, Suspense, lazy } from 'react';
import { FileUp, Loader2 } from 'lucide-react';

// Lazy load the modal — only loaded when the user clicks the import button
const ImportModal = lazy(() =>
  import('./ImportModal').then((m) => ({ default: m.ImportModal }))
);

// =============================================================================
// ImportButton
// =============================================================================

export function ImportButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100 hover:text-surface-900"
        aria-label="Import resume from PDF"
      >
        <FileUp className="h-4 w-4" />
        <span className="hidden md:inline">Import</span>
      </button>

      {isOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
              <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-2xl">
                <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
              </div>
            </div>
          }
        >
          <ImportModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
