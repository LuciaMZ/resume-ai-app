// =============================================================================
// Tests: ImportModal Component (src/components/import/ImportModal.tsx)
// =============================================================================
// Light UI tests for the ImportModal. We mock hooks and the import pipeline
// to avoid deep dependency chains.
// =============================================================================

import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// =============================================================================
// Mocks
// =============================================================================

const mockDispatch = vi.fn();
const mockAddToast = vi.fn();
const mockImportResumeFromPDF = vi.fn();

vi.mock('@/hooks/useResumeData', () => ({
  useResumeData: () => ({
    state: {
      meta: {
        id: 'test-id',
        templateId: 'classic',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        schemaVersion: 1,
      },
      personalInfo: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        location: '',
      },
      sections: [],
    },
    dispatch: mockDispatch,
  }),
}));

// Track whether AI is enabled per-test
let isAIEnabledMock = true;

vi.mock('@/hooks/useAIConfig', () => ({
  useAIConfig: () => ({
    aiConfig: isAIEnabledMock
      ? {
          activeProvider: 'openai',
          providers: {
            openai: { apiKey: 'sk-test', model: 'gpt-4' },
          },
        }
      : null,
    isAIEnabled: isAIEnabledMock,
  }),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    addToast: mockAddToast,
  }),
}));

vi.mock('@/lib/import', () => ({
  importResumeFromPDF: (...args: unknown[]) => mockImportResumeFromPDF(...args),
  ImportError: class ImportError extends Error {
    code: string;
    constructor(message: string, code: string) {
      super(message);
      this.name = 'ImportError';
      this.code = code;
    }
  },
}));

import { ImportModal } from '@/components/import/ImportModal';

// =============================================================================
// Tests
// =============================================================================

describe('ImportModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isAIEnabledMock = true;
  });

  // --- Rendering ---

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ImportModal isOpen={false} onClose={vi.fn()} />
    );

    expect(container.innerHTML).toBe('');
  });

  it('renders the modal when isOpen is true', () => {
    render(<ImportModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Import Resume')).toBeInTheDocument();
  });

  it('renders close button', () => {
    render(<ImportModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByLabelText('Close import dialog')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<ImportModal isOpen={true} onClose={onClose} />);

    fireEvent.click(screen.getByLabelText('Close import dialog'));

    expect(onClose).toHaveBeenCalled();
  });

  // --- AI not configured ---

  it('shows AI configuration warning when AI is not enabled', () => {
    isAIEnabledMock = false;

    render(<ImportModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('AI configuration required')).toBeInTheDocument();
    expect(screen.getByText(/configure an AI/)).toBeInTheDocument();
  });

  // --- File selection ---

  it('shows file drop zone when AI is enabled', () => {
    render(<ImportModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText(/Drag & drop your resume PDF/)).toBeInTheDocument();
  });

  it('shows Start Import button (initially disabled)', () => {
    render(<ImportModal isOpen={true} onClose={vi.fn()} />);

    const startBtn = screen.getByText('Start Import');
    expect(startBtn).toBeInTheDocument();
    expect(startBtn).toBeDisabled();
  });

  // --- Error state ---

  it('displays error message when import fails', async () => {
    mockImportResumeFromPDF.mockRejectedValue(new Error('AI parsing failed'));

    render(<ImportModal isOpen={true} onClose={vi.fn()} />);

    // Simulate file selection via the drop zone's file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const pdfFile = new File(['%PDF-1.4'], 'resume.pdf', { type: 'application/pdf' });

    fireEvent.change(fileInput, { target: { files: [pdfFile] } });

    // Now click Start Import
    const startBtn = screen.getByText('Start Import');
    fireEvent.click(startBtn);

    // Wait for the error to appear
    await waitFor(() => {
      expect(screen.getByText('Import failed')).toBeInTheDocument();
      expect(screen.getByText('AI parsing failed')).toBeInTheDocument();
    });

    // Retry button should be visible
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });
});
