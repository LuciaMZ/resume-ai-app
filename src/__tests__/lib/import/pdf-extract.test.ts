// =============================================================================
// Tests: PDF Text Extraction (src/lib/import/pdf-extract.ts)
// =============================================================================

import { PDFExtractionError } from '@/lib/import/errors';

// Mock pdfjs-dist dynamic import
const mockGetDocument = vi.fn();

vi.mock('pdfjs-dist', () => ({
  default: {
    getDocument: (...args: unknown[]) => mockGetDocument(...args),
    GlobalWorkerOptions: { workerSrc: '' },
  },
  getDocument: (...args: unknown[]) => mockGetDocument(...args),
  GlobalWorkerOptions: { workerSrc: '' },
}));

// Import after mocks are set up
import { extractTextFromPDF } from '@/lib/import/pdf-extract';

// =============================================================================
// Helpers
// =============================================================================

function createMockFile(
  name: string,
  size: number,
  type: string,
  content: ArrayBuffer = new ArrayBuffer(8)
): File {
  const file = new File([content], name, { type });
  // Override the size property since File constructor doesn't allow setting it directly
  Object.defineProperty(file, 'size', { value: size });
  // JSDOM compatibility: ensure File has arrayBuffer() across versions
  Object.defineProperty(file, 'arrayBuffer', {
    value: () => Promise.resolve(content),
    configurable: true,
  });
  return file;
}

function setupPDFMock(pages: { text: string }[]) {
  mockGetDocument.mockReturnValue({
    promise: Promise.resolve({
      numPages: pages.length,
      getPage: vi.fn((pageNum: number) =>
        Promise.resolve({
          getTextContent: vi.fn(() =>
            Promise.resolve({
              items: pages[pageNum - 1].text
                .split(' ')
                .map((str) => ({ str })),
            })
          ),
        })
      ),
    }),
  });
}

// =============================================================================
// Tests
// =============================================================================

describe('extractTextFromPDF', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- File type validation ---

  it('rejects non-PDF file by MIME type', async () => {
    const file = createMockFile('resume.docx', 1024, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

    await expect(extractTextFromPDF(file)).rejects.toThrow(PDFExtractionError);
    await expect(extractTextFromPDF(file)).rejects.toThrow('Invalid file type');
  });

  it('rejects non-PDF file by extension', async () => {
    const file = createMockFile('resume.txt', 1024, 'text/plain');

    try {
      await extractTextFromPDF(file);
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(PDFExtractionError);
      expect((err as PDFExtractionError).code).toBe('invalid_file_type');
    }
  });

  it('accepts file with application/pdf MIME type', async () => {
    const file = createMockFile('resume.pdf', 1024, 'application/pdf');
    setupPDFMock([{ text: 'John Doe Software Engineer with extensive experience in building applications' }]);

    const result = await extractTextFromPDF(file);
    expect(result.text).toContain('John');
  });

  it('accepts file with .pdf extension even without PDF MIME type', async () => {
    // Some systems report empty or generic MIME type for PDFs
    const file = createMockFile('resume.pdf', 1024, '');
    setupPDFMock([{ text: 'John Doe Software Engineer with extensive experience in building applications' }]);

    const result = await extractTextFromPDF(file);
    expect(result.text).toContain('John');
  });

  // --- File size validation ---

  it('rejects files larger than 10 MB', async () => {
    const tenMBPlus = 10 * 1024 * 1024 + 1;
    const file = createMockFile('resume.pdf', tenMBPlus, 'application/pdf');

    try {
      await extractTextFromPDF(file);
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(PDFExtractionError);
      expect((err as PDFExtractionError).code).toBe('file_too_large');
      expect((err as PDFExtractionError).message).toContain('10 MB');
    }
  });

  it('accepts files exactly at 10 MB', async () => {
    const exactlyTenMB = 10 * 1024 * 1024;
    const file = createMockFile('resume.pdf', exactlyTenMB, 'application/pdf');
    setupPDFMock([{ text: 'John Doe Software Engineer with extensive experience in building applications' }]);

    const result = await extractTextFromPDF(file);
    expect(result.text).toBeTruthy();
  });

  // --- Text extraction from multi-page PDF ---

  it('extracts text from a multi-page PDF', async () => {
    setupPDFMock([
      { text: 'Page one content with enough text to pass the minimum threshold check' },
      { text: 'Page two content with additional resume information and details' },
      { text: 'Page three content with skills and education background info' },
    ]);

    const file = createMockFile('resume.pdf', 5000, 'application/pdf');
    const result = await extractTextFromPDF(file);

    expect(result.pageCount).toBe(3);
    expect(result.text).toContain('Page one');
    expect(result.text).toContain('Page two');
    expect(result.text).toContain('Page three');
    // Pages should be separated by double newlines
    expect(result.text).toContain('\n\n');
  });

  it('returns correct page count', async () => {
    setupPDFMock([
      { text: 'First page with a good amount of content for testing extraction' },
      { text: 'Second page with additional experience and work history details' },
    ]);

    const file = createMockFile('resume.pdf', 5000, 'application/pdf');
    const result = await extractTextFromPDF(file);

    expect(result.pageCount).toBe(2);
  });

  // --- Scanned/empty PDF detection ---

  it('warns when extracted text is less than 50 characters (scanned PDF)', async () => {
    setupPDFMock([{ text: 'Short' }]);

    const file = createMockFile('scanned.pdf', 5000, 'application/pdf');
    const result = await extractTextFromPDF(file);

    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('scanned');
  });

  it('does not warn when extracted text meets minimum threshold', async () => {
    // More than 50 characters of text
    setupPDFMock([{
      text: 'John Doe Senior Software Engineer at TechCorp with 10 years of experience building scalable applications',
    }]);

    const file = createMockFile('good.pdf', 5000, 'application/pdf');
    const result = await extractTextFromPDF(file);

    expect(result.warnings).toHaveLength(0);
  });

  // --- Error handling for corrupted PDF ---

  it('throws PDFExtractionError for corrupted PDF (getDocument fails)', async () => {
    mockGetDocument.mockReturnValue({
      promise: Promise.resolve().then(() => {
        throw new Error('Invalid PDF structure');
      }),
    });

    const file = createMockFile('corrupted.pdf', 5000, 'application/pdf');

    try {
      await extractTextFromPDF(file);
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(PDFExtractionError);
      expect((err as PDFExtractionError).code).toBe('extraction_failed');
      expect((err as PDFExtractionError).message).toContain('corrupted');
    }
  });

  it('throws PDFExtractionError when arrayBuffer() fails', async () => {
    const file = createMockFile('bad.pdf', 5000, 'application/pdf');
    // Override arrayBuffer to throw
    Object.defineProperty(file, 'arrayBuffer', {
      value: () => Promise.reject(new Error('Read error')),
    });

    try {
      await extractTextFromPDF(file);
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(PDFExtractionError);
      expect((err as PDFExtractionError).code).toBe('extraction_failed');
    }
  });
});
