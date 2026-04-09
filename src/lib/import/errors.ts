// =============================================================================
// Import Pipeline Error Types
// =============================================================================
// Custom error classes for the PDF import pipeline.
// Follows the pattern established by AIError in src/lib/ai/utils.ts.
// =============================================================================

/** Error codes for the import pipeline */
export type ImportErrorCode =
  | 'invalid_file_type'
  | 'file_too_large'
  | 'no_text_extracted'
  | 'extraction_failed'
  | 'no_ai_configured'
  | 'ai_request_failed'
  | 'ai_rate_limit'
  | 'invalid_response'
  | 'validation_failed'
  | 'sanitization_failed'
  | 'cancelled';

/** Base error class for all import pipeline errors */
export class ImportError extends Error {
  constructor(
    message: string,
    public readonly code: ImportErrorCode
  ) {
    super(message);
    this.name = 'ImportError';
  }
}

/** Error during PDF text extraction */
export class PDFExtractionError extends ImportError {
  constructor(
    message: string,
    code: Extract<ImportErrorCode, 'invalid_file_type' | 'file_too_large' | 'no_text_extracted' | 'extraction_failed'>
  ) {
    super(message, code);
    this.name = 'PDFExtractionError';
  }
}

/** Error during AI-powered parsing */
export class AIParsingError extends ImportError {
  constructor(
    message: string,
    code: Extract<ImportErrorCode, 'no_ai_configured' | 'ai_request_failed' | 'ai_rate_limit' | 'invalid_response'>
  ) {
    super(message, code);
    this.name = 'AIParsingError';
  }
}

/** Error during data validation / sanitization */
export class ValidationError extends ImportError {
  constructor(
    message: string,
    code: Extract<ImportErrorCode, 'validation_failed' | 'sanitization_failed'> = 'validation_failed'
  ) {
    super(message, code);
    this.name = 'ValidationError';
  }
}
