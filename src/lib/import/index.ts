// =============================================================================
// Import Pipeline — Public API
// =============================================================================
// Barrel export for the PDF resume import module.
// Orchestrates: file validation → extract text → AI parse → validate → sanitize
// =============================================================================

import type { ResumeData } from '@/types/resume';
import type { ImportProgress, ImportAIConfig, ImportResult } from './types';
import { ImportError } from './errors';
import { extractTextFromPDF } from './pdf-extract';
import { parseResumeWithAI } from './ai-parse';
import { validateAndFixResumeData } from './validate';
import { sanitizeResumeHTML } from './sanitize';

// ── Re-exports ─────────────────────────────────────────────────────────────

export {
  ImportError,
  PDFExtractionError,
  AIParsingError,
  ValidationError,
} from './errors';

export type { ImportErrorCode } from './errors';

export type {
  ImportStep,
  ImportProgress,
  ImportResult,
  ImportAIConfig,
  ExtractionResult,
} from './types';

export { extractTextFromPDF } from './pdf-extract';
export { parseResumeWithAI } from './ai-parse';
export { validateAndFixResumeData } from './validate';
export { sanitizeResumeHTML } from './sanitize';

// ── Pipeline Orchestration ─────────────────────────────────────────────────

/**
 * Import a resume from a PDF file using AI-powered parsing.
 *
 * Full pipeline:
 * 1. File validation (type + size)
 * 2. PDF text extraction via pdfjs-dist
 * 3. AI-powered parsing into ResumeData structure
 * 4. Validation and UUID regeneration
 * 5. HTML sanitization (DOMPurify)
 *
 * @param file — The PDF file to import
 * @param aiConfig — AI provider configuration (apiKey, model, provider)
 * @param onProgress — Optional callback for progress updates
 * @param signal — Optional AbortSignal for cancellation
 * @returns The parsed, validated, and sanitized ResumeData
 */
export async function importResumeFromPDF(
  file: File,
  aiConfig: ImportAIConfig,
  onProgress?: (progress: ImportProgress) => void,
  signal?: AbortSignal
): Promise<ImportResult> {
  const report = (step: ImportProgress['step'], message: string) => {
    onProgress?.({ step, message });
  };

  try {
    // ── Step 1: Upload / file validation ─────────────────────────────
    report('uploading', 'Validating file...');
    checkAborted(signal);

    // ── Step 2: Extract text from PDF ────────────────────────────────
    report('extracting', 'Extracting text from PDF...');
    checkAborted(signal);

    const extraction = await extractTextFromPDF(file);
    const warnings = [...extraction.warnings];

    if (!extraction.text) {
      report('error', 'No text could be extracted from the PDF.');
      throw new ImportError(
        'No text could be extracted from this PDF. It may be a scanned document or image-only.',
        'no_text_extracted'
      );
    }

    // ── Step 3: AI parsing ───────────────────────────────────────────
    report('parsing', 'Analyzing resume with AI... This may take a moment.');
    checkAborted(signal);

    const rawData: ResumeData = await parseResumeWithAI(
      extraction.text,
      aiConfig.apiKey,
      aiConfig.model,
      aiConfig.provider,
      signal
    );

    // ── Step 4: Validation ───────────────────────────────────────────
    report('validating', 'Validating and structuring data...');
    checkAborted(signal);

    const validatedData = validateAndFixResumeData(rawData);

    // ── Step 5: Sanitization ─────────────────────────────────────────
    const sanitizedData = sanitizeResumeHTML(validatedData);

    // ── Complete ─────────────────────────────────────────────────────
    report('complete', 'Resume imported successfully!');

    return {
      data: sanitizedData,
      pageCount: extraction.pageCount,
      extractedTextLength: extraction.text.length,
      warnings,
    };
  } catch (error) {
    // Re-throw abort errors as-is
    if (error instanceof DOMException && error.name === 'AbortError') {
      report('error', 'Import was cancelled.');
      throw new ImportError('Import was cancelled.', 'cancelled');
    }

    // Re-throw ImportError subclasses as-is
    if (error instanceof ImportError) {
      report('error', error.message);
      throw error;
    }

    // Wrap unexpected errors
    report('error', 'An unexpected error occurred during import.');
    throw new ImportError(
      `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'extraction_failed'
    );
  }
}

// =============================================================================
// Helpers
// =============================================================================

/** Check if the signal has been aborted and throw if so */
function checkAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException('Import was cancelled.', 'AbortError');
  }
}
