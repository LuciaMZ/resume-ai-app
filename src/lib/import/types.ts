// =============================================================================
// Import Pipeline Types
// =============================================================================

import type { ResumeData } from '@/types/resume';

/** Steps in the import pipeline, used for progress reporting */
export type ImportStep =
  | 'uploading'
  | 'extracting'
  | 'parsing'
  | 'validating'
  | 'preview'
  | 'complete'
  | 'error';

/** Progress update emitted by the import pipeline */
export interface ImportProgress {
  step: ImportStep;
  message: string;
}

/** Successful result from the import pipeline */
export interface ImportResult {
  /** The parsed, validated, and sanitized resume data */
  data: ResumeData;
  /** Number of pages in the source PDF */
  pageCount: number;
  /** Number of characters extracted from the PDF */
  extractedTextLength: number;
  /** Warning messages (e.g., low text extraction) */
  warnings: string[];
}

/** Configuration needed for AI parsing */
export interface ImportAIConfig {
  apiKey: string;
  model: string;
  provider: string;
}

/** Raw extraction result before AI parsing */
export interface ExtractionResult {
  text: string;
  pageCount: number;
  warnings: string[];
}
