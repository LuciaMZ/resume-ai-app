// =============================================================================
// PDF Text Extraction
// =============================================================================
// Extracts raw text from a PDF file using pdfjs-dist.
// The library is lazy-loaded via dynamic import to keep it out of the initial
// bundle (~400KB gzipped). The PDF.js worker is loaded from a CDN.
// =============================================================================

import { PDFExtractionError } from './errors';
import type { ExtractionResult } from './types';

/** Maximum file size: 10 MB */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Minimum characters to consider extraction successful */
const MIN_EXTRACTED_CHARS = 50;

/** The installed pdfjs-dist version — must match the CDN worker */
const PDFJS_VERSION = '5.5.207';

/**
 * Extract text content from a PDF file.
 *
 * - Validates file type (must be application/pdf or .pdf extension)
 * - Validates file size (max 10 MB)
 * - Lazy-loads pdfjs-dist and sets up the worker from CDN
 * - Extracts text from all pages, concatenated with double newlines
 * - Warns if the PDF appears to be scanned (< 50 chars extracted)
 */
export async function extractTextFromPDF(file: File): Promise<ExtractionResult> {
  // ── File validation ──────────────────────────────────────────────────
  if (!isValidPDFFile(file)) {
    throw new PDFExtractionError(
      'Invalid file type. Please upload a PDF file.',
      'invalid_file_type'
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    throw new PDFExtractionError(
      `File is too large (${sizeMB} MB). Maximum allowed size is 10 MB.`,
      'file_too_large'
    );
  }

  // ── Lazy-load pdfjs-dist ─────────────────────────────────────────────
  const pdfjs = await loadPdfJs();

  // ── Read the file into an ArrayBuffer ────────────────────────────────
  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = await file.arrayBuffer();
  } catch {
    throw new PDFExtractionError(
      'Failed to read the PDF file. The file may be corrupted.',
      'extraction_failed'
    );
  }

  // ── Load and extract text ────────────────────────────────────────────
  const warnings: string[] = [];
  let pageCount = 0;

  try {
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    pageCount = pdf.numPages;

    const pageTexts: string[] = [];

    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .filter((item) => 'str' in item)
        .map((item) => (item as { str: string }).str)
        .join(' ');
      pageTexts.push(pageText);
    }

    const text = pageTexts.join('\n\n');

    // ── Check for scanned/image-only PDFs ──────────────────────────────
    if (text.trim().length < MIN_EXTRACTED_CHARS) {
      warnings.push(
        'Very little text was extracted from this PDF. ' +
        'It may be a scanned document or contain mostly images. ' +
        'AI parsing results may be poor.'
      );
    }

    return {
      text: text.trim(),
      pageCount,
      warnings,
    };
  } catch (error) {
    if (error instanceof PDFExtractionError) throw error;
    throw new PDFExtractionError(
      'Failed to extract text from the PDF. The file may be corrupted or password-protected.',
      'extraction_failed'
    );
  }
}

// =============================================================================
// Helpers
// =============================================================================

/** Check whether the file is a valid PDF */
function isValidPDFFile(file: File): boolean {
  // Check MIME type
  if (file.type === 'application/pdf') return true;
  // Fallback: check file extension
  return file.name.toLowerCase().endsWith('.pdf');
}

/** Lazy-load pdfjs-dist and configure the worker */
async function loadPdfJs() {
  const pdfjs = await import('pdfjs-dist');

  // Set the worker source to CDN — must match the installed version
  pdfjs.GlobalWorkerOptions.workerSrc =
    `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

  return pdfjs;
}
