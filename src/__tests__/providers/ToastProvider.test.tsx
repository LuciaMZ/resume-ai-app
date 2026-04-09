import { render, screen, fireEvent } from '@testing-library/react';
import { ToastProvider } from '@/providers/ToastProvider';
import { setStorageItem, STORAGE_KEYS } from '@/lib/storage';

function Writer() {
  return (
    <button
      type="button"
      onClick={() => setStorageItem(STORAGE_KEYS.APP_SETTINGS, { theme: 'dark' })}
    >
      Write
    </button>
  );
}

describe('ToastProvider storage error handling', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('shows a toast when storage writes fail', async () => {
    const setItemSpy = vi
      .spyOn(window.localStorage, 'setItem')
      .mockImplementation(() => {
        throw new Error('quota exceeded');
      });

    render(
      <ToastProvider>
        <Writer />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Write' }));

    expect(
      await screen.findByText(
        'Could not save changes to browser storage. Your data may not persist if this continues.'
      )
    ).toBeInTheDocument();

    setItemSpy.mockRestore();
  });
});
