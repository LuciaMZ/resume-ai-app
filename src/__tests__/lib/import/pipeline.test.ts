// =============================================================================
// Tests: Import Pipeline Orchestration (src/lib/import/index.ts)
// =============================================================================
// Tests the importResumeFromPDF pipeline, mocking all sub-modules.
// =============================================================================

import type { ExtractionResult } from '@/lib/import/types';
import type { ResumeData } from '@/types/resume';

// =============================================================================
// Mocks
// =============================================================================

const mockExtractTextFromPDF = vi.fn();
const mockParseResumeWithAI = vi.fn();
const mockValidateAndFixResumeData = vi.fn();
const mockSanitizeResumeHTML = vi.fn();

vi.mock('@/lib/import/pdf-extract', () => ({
  extractTextFromPDF: (...args: unknown[]) => mockExtractTextFromPDF(...args),
}));

vi.mock('@/lib/import/ai-parse', () => ({
  parseResumeWithAI: (...args: unknown[]) => mockParseResumeWithAI(...args),
}));

vi.mock('@/lib/import/validate', () => ({
  validateAndFixResumeData: (...args: unknown[]) => mockValidateAndFixResumeData(...args),
}));

vi.mock('@/lib/import/sanitize', () => ({
  sanitizeResumeHTML: (...args: unknown[]) => mockSanitizeResumeHTML(...args),
}));

import { importResumeFromPDF, ImportError, PDFExtractionError, AIParsingError } from '@/lib/import';

// =============================================================================
// Helpers
// =============================================================================

function makeFile(): File {
  return new File(['%PDF-1.4'], 'resume.pdf', { type: 'application/pdf' });
}

function makeAIConfig() {
  return {
    apiKey: 'sk-test',
    model: 'gpt-4',
    provider: 'openai',
  };
}

function makeExtractionResult(): ExtractionResult {
  return {
    text: 'John Doe, Software Engineer with 10 years experience',
    pageCount: 2,
    warnings: [],
  };
}

function makeResumeData(): ResumeData {
  return {
    meta: {
      id: 'test-id',
      templateId: 'classic',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      schemaVersion: 1,
    },
    personalInfo: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '555-1234',
      location: 'SF',
    },
    sections: [],
  };
}

function setupSuccessfulPipeline() {
  const extraction = makeExtractionResult();
  const rawData = makeResumeData();
  const validatedData = { ...rawData, meta: { ...rawData.meta, id: 'validated-id' } };
  const sanitizedData = { ...validatedData, meta: { ...validatedData.meta, id: 'sanitized-id' } };

  mockExtractTextFromPDF.mockResolvedValue(extraction);
  mockParseResumeWithAI.mockResolvedValue(rawData);
  mockValidateAndFixResumeData.mockReturnValue(validatedData);
  mockSanitizeResumeHTML.mockReturnValue(sanitizedData);

  return { extraction, rawData, validatedData, sanitizedData };
}

// =============================================================================
// Tests
// =============================================================================

describe('importResumeFromPDF', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Full pipeline orchestration ---

  it('runs the full pipeline in correct order: extract → parse → validate → sanitize', async () => {
    const { extraction, rawData, validatedData, sanitizedData } = setupSuccessfulPipeline();

    const result = await importResumeFromPDF(makeFile(), makeAIConfig());

    // Each stage should be called once
    expect(mockExtractTextFromPDF).toHaveBeenCalledTimes(1);
    expect(mockParseResumeWithAI).toHaveBeenCalledTimes(1);
    expect(mockValidateAndFixResumeData).toHaveBeenCalledTimes(1);
    expect(mockSanitizeResumeHTML).toHaveBeenCalledTimes(1);

    // Parse should receive extracted text
    expect(mockParseResumeWithAI).toHaveBeenCalledWith(
      extraction.text,
      'sk-test',
      'gpt-4',
      'openai',
      undefined // no signal
    );

    // Validate should receive raw AI data
    expect(mockValidateAndFixResumeData).toHaveBeenCalledWith(rawData);

    // Sanitize should receive validated data
    expect(mockSanitizeResumeHTML).toHaveBeenCalledWith(validatedData);

    // Result should contain sanitized data
    expect(result.data).toBe(sanitizedData);
    expect(result.pageCount).toBe(2);
    expect(result.extractedTextLength).toBe(extraction.text.length);
  });

  it('returns warnings from extraction result', async () => {
    const extraction = makeExtractionResult();
    extraction.warnings = ['Low text extraction warning'];

    mockExtractTextFromPDF.mockResolvedValue(extraction);
    mockParseResumeWithAI.mockResolvedValue(makeResumeData());
    mockValidateAndFixResumeData.mockReturnValue(makeResumeData());
    mockSanitizeResumeHTML.mockReturnValue(makeResumeData());

    const result = await importResumeFromPDF(makeFile(), makeAIConfig());

    expect(result.warnings).toContain('Low text extraction warning');
  });

  // --- Progress callback ---

  it('calls progress callback with correct steps', async () => {
    setupSuccessfulPipeline();

    const progressCalls: { step: string; message: string }[] = [];
    const onProgress = vi.fn((p) => progressCalls.push(p));

    await importResumeFromPDF(makeFile(), makeAIConfig(), onProgress);

    expect(onProgress).toHaveBeenCalled();

    // Verify the pipeline reports expected steps
    const steps = progressCalls.map((p) => p.step);
    expect(steps).toContain('uploading');
    expect(steps).toContain('extracting');
    expect(steps).toContain('parsing');
    expect(steps).toContain('validating');
    expect(steps).toContain('complete');
  });

  it('calls progress callback with error step on failure', async () => {
    mockExtractTextFromPDF.mockRejectedValue(
      new PDFExtractionError('Bad file', 'extraction_failed')
    );

    const progressCalls: { step: string; message: string }[] = [];
    const onProgress = vi.fn((p) => progressCalls.push(p));

    await expect(
      importResumeFromPDF(makeFile(), makeAIConfig(), onProgress)
    ).rejects.toThrow();

    const steps = progressCalls.map((p) => p.step);
    expect(steps).toContain('error');
  });

  // --- AbortSignal cancellation ---

  it('passes AbortSignal to parseResumeWithAI', async () => {
    setupSuccessfulPipeline();

    const controller = new AbortController();
    await importResumeFromPDF(makeFile(), makeAIConfig(), undefined, controller.signal);

    // AI parse should receive the signal
    const parseCall = mockParseResumeWithAI.mock.calls[0];
    expect(parseCall[4]).toBe(controller.signal);
  });

  it('throws ImportError with cancelled code when signal is already aborted', async () => {
    setupSuccessfulPipeline();

    const controller = new AbortController();
    controller.abort();

    try {
      await importResumeFromPDF(makeFile(), makeAIConfig(), undefined, controller.signal);
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ImportError);
      expect((err as ImportError).code).toBe('cancelled');
    }
  });

  it('wraps AbortError from sub-modules as ImportError with cancelled code', async () => {
    mockExtractTextFromPDF.mockResolvedValue(makeExtractionResult());
    mockParseResumeWithAI.mockRejectedValue(
      new DOMException('The operation was aborted.', 'AbortError')
    );

    try {
      await importResumeFromPDF(makeFile(), makeAIConfig());
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ImportError);
      expect((err as ImportError).code).toBe('cancelled');
    }
  });

  // --- Error propagation from each stage ---

  it('propagates PDFExtractionError from extraction stage', async () => {
    const extractionError = new PDFExtractionError('Invalid PDF', 'invalid_file_type');
    mockExtractTextFromPDF.mockRejectedValue(extractionError);

    await expect(
      importResumeFromPDF(makeFile(), makeAIConfig())
    ).rejects.toThrow(PDFExtractionError);
  });

  it('throws ImportError when extraction returns empty text', async () => {
    mockExtractTextFromPDF.mockResolvedValue({
      text: '',
      pageCount: 1,
      warnings: [],
    });

    try {
      await importResumeFromPDF(makeFile(), makeAIConfig());
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ImportError);
      expect((err as ImportError).code).toBe('no_text_extracted');
    }
  });

  it('propagates AIParsingError from AI parsing stage', async () => {
    mockExtractTextFromPDF.mockResolvedValue(makeExtractionResult());
    mockParseResumeWithAI.mockRejectedValue(
      new AIParsingError('Rate limit', 'ai_rate_limit')
    );

    try {
      await importResumeFromPDF(makeFile(), makeAIConfig());
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AIParsingError);
      expect((err as AIParsingError).code).toBe('ai_rate_limit');
    }
  });

  it('propagates ValidationError from validation stage', async () => {
    const { ValidationError } = await import('@/lib/import/errors');

    mockExtractTextFromPDF.mockResolvedValue(makeExtractionResult());
    mockParseResumeWithAI.mockResolvedValue(makeResumeData());
    mockValidateAndFixResumeData.mockImplementation(() => {
      throw new ValidationError('Bad data', 'validation_failed');
    });

    await expect(
      importResumeFromPDF(makeFile(), makeAIConfig())
    ).rejects.toThrow(ValidationError);
  });

  it('wraps unexpected errors as ImportError with extraction_failed code', async () => {
    mockExtractTextFromPDF.mockResolvedValue(makeExtractionResult());
    mockParseResumeWithAI.mockResolvedValue(makeResumeData());
    mockValidateAndFixResumeData.mockReturnValue(makeResumeData());
    mockSanitizeResumeHTML.mockImplementation(() => {
      throw new Error('Unexpected boom');
    });

    try {
      await importResumeFromPDF(makeFile(), makeAIConfig());
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ImportError);
      expect((err as ImportError).code).toBe('extraction_failed');
      expect((err as ImportError).message).toContain('Unexpected boom');
    }
  });
});
