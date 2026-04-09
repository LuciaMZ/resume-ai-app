'use client';

import { useRef, useState, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useResumeData } from '@/hooks/useResumeData';

// =============================================================================
// usePDFExport Hook
// =============================================================================

/**
 * Hook that manages PDF export via the browser's native print dialog.
 *
 * Uses `react-to-print` to trigger printing of a hidden container that
 * renders the resume template at full, unscaled print dimensions.
 *
 * @returns contentRef  - Attach to the hidden print target container
 * @returns handleExport - Call to open the print dialog
 * @returns isExporting  - True while the print dialog is open / preparing
 */
export function usePDFExport() {
  const { state } = useResumeData();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  /**
   * Build a document title from the user's name for a meaningful PDF filename.
   * Falls back to "Resume" if no name is entered.
   */
  const getDocumentTitle = useCallback(() => {
    const { firstName, lastName } = state.personalInfo;
    const name = [firstName, lastName].filter(Boolean).join(' ').trim();
    return name ? `${name} - Resume` : 'Resume';
  }, [state.personalInfo]);

  const triggerPrint = useReactToPrint({
    contentRef,
    documentTitle: getDocumentTitle,
    // Ensure @page rules are set in the print iframe
    pageStyle: `
      @page {
        size: letter;
        margin: 0;
      }
      *, *::before, *::after {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
    `,
    onBeforePrint: async () => {
      setIsExporting(true);
    },
    onAfterPrint: () => {
      setIsExporting(false);
    },
    onPrintError: (errorLocation, error) => {
      console.error(`[usePDFExport] Print error at ${errorLocation}:`, error);
      setIsExporting(false);
    },
  });

  const handleExport = useCallback(() => {
    if (isExporting) return;
    triggerPrint();
  }, [isExporting, triggerPrint]);

  return {
    contentRef,
    handleExport,
    isExporting,
  };
}
