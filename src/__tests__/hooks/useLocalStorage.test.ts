import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('returns the initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));

    expect(result.current[0]).toBe('default');
  });

  it('returns stored value when localStorage has data', () => {
    localStorage.setItem('test-key', JSON.stringify('stored-value'));

    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));

    expect(result.current[0]).toBe('stored-value');
  });

  it('returns stored object value from localStorage', () => {
    const storedObj = { name: 'Alice', count: 42 };
    localStorage.setItem('obj-key', JSON.stringify(storedObj));

    const { result } = renderHook(() =>
      useLocalStorage('obj-key', { name: '', count: 0 })
    );

    expect(result.current[0]).toEqual(storedObj);
  });

  it('updates both state and localStorage on setValue', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'test-key',
      JSON.stringify('updated')
    );
  });

  it('supports updater function pattern', () => {
    const { result } = renderHook(() => useLocalStorage('counter', 10));

    act(() => {
      result.current[1]((prev) => prev + 5);
    });

    expect(result.current[0]).toBe(15);
  });

  it('supports multiple updater function calls', () => {
    const { result } = renderHook(() =>
      useLocalStorage<string[]>('list', ['a'])
    );

    act(() => {
      result.current[1]((prev) => [...prev, 'b']);
    });

    act(() => {
      result.current[1]((prev) => [...prev, 'c']);
    });

    expect(result.current[0]).toEqual(['a', 'b', 'c']);
  });

  it('handles invalid JSON in localStorage gracefully and returns initialValue', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem('bad-key', '{not valid json!!!');

    const { result } = renderHook(() => useLocalStorage('bad-key', 'fallback'));

    expect(result.current[0]).toBe('fallback');
    expect(warnSpy).toHaveBeenCalledWith(
      '[storage] Failed to parse key "bad-key"'
    );

    warnSpy.mockRestore();
  });

  it('writes initial value to localStorage on mount via useEffect', () => {
    renderHook(() => useLocalStorage('new-key', 'initial'));

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'new-key',
      JSON.stringify('initial')
    );
  });
});
