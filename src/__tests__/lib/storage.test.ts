import {
  STORAGE_KEYS,
  getStorageItem,
  setStorageItem,
  removeStorageItem,
} from '@/lib/storage';

describe('STORAGE_KEYS', () => {
  it('has the correct RESUME_DATA key', () => {
    expect(STORAGE_KEYS.RESUME_DATA).toBe('resumeAIapp:resume');
  });

  it('has the correct AI_CONFIG key', () => {
    expect(STORAGE_KEYS.AI_CONFIG).toBe('resumeAIapp:ai-config');
  });

  it('has the correct APP_SETTINGS key', () => {
    expect(STORAGE_KEYS.APP_SETTINGS).toBe('resumeAIapp:settings');
  });
});

describe('getStorageItem', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('returns the parsed value for an existing key', () => {
    const data = { name: 'Alice', age: 30 };
    localStorage.setItem('test-key', JSON.stringify(data));

    const result = getStorageItem<{ name: string; age: number }>('test-key');
    expect(result).toEqual(data);
  });

  it('returns null for a missing key', () => {
    const result = getStorageItem('nonexistent-key');
    expect(result).toBeNull();
  });

  it('returns null and does not throw for invalid JSON', () => {
    localStorage.setItem('bad-json', '{not valid json!!!');

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(() => {
      const result = getStorageItem('bad-json');
      expect(result).toBeNull();
    }).not.toThrow();

    expect(warnSpy).toHaveBeenCalledWith(
      '[storage] Failed to parse key "bad-json"'
    );

    warnSpy.mockRestore();
  });

  it('handles complex nested objects', () => {
    const complex = {
      sections: [{ id: '1', entries: [{ id: 'a', content: 'hello' }] }],
      meta: { version: 1 },
    };
    localStorage.setItem('complex', JSON.stringify(complex));

    const result = getStorageItem<typeof complex>('complex');
    expect(result).toEqual(complex);
  });

  it('handles string values', () => {
    localStorage.setItem('str', JSON.stringify('hello world'));

    const result = getStorageItem<string>('str');
    expect(result).toBe('hello world');
  });

  it('handles numeric values', () => {
    localStorage.setItem('num', JSON.stringify(42));

    const result = getStorageItem<number>('num');
    expect(result).toBe(42);
  });

  it('handles boolean values', () => {
    localStorage.setItem('bool', JSON.stringify(true));

    const result = getStorageItem<boolean>('bool');
    expect(result).toBe(true);
  });

  it('handles null JSON value (stored as "null")', () => {
    localStorage.setItem('null-val', 'null');

    const result = getStorageItem<null>('null-val');
    expect(result).toBeNull();
  });

});

describe('setStorageItem', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('serializes and stores an object', () => {
    const data = { foo: 'bar', count: 5 };
    setStorageItem('my-key', data);

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'my-key',
      JSON.stringify(data)
    );
    expect(localStorage.getItem('my-key')).toBe(JSON.stringify(data));
  });

  it('serializes and stores a string value', () => {
    setStorageItem('str-key', 'hello');

    expect(localStorage.getItem('str-key')).toBe('"hello"');
  });

  it('serializes and stores a number', () => {
    setStorageItem('num-key', 99);

    expect(localStorage.getItem('num-key')).toBe('99');
  });

  it('serializes and stores an array', () => {
    const arr = [1, 2, 3];
    setStorageItem('arr-key', arr);

    expect(localStorage.getItem('arr-key')).toBe(JSON.stringify(arr));
  });

  it('overwrites an existing value', () => {
    setStorageItem('key', 'first');
    setStorageItem('key', 'second');

    const result = getStorageItem<string>('key');
    expect(result).toBe('second');
  });
});

describe('removeStorageItem', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('removes an existing key from localStorage', () => {
    localStorage.setItem('to-remove', JSON.stringify('value'));

    removeStorageItem('to-remove');

    expect(localStorage.removeItem).toHaveBeenCalledWith('to-remove');
    expect(localStorage.getItem('to-remove')).toBeNull();
  });

  it('does not throw when removing a non-existent key', () => {
    expect(() => {
      removeStorageItem('does-not-exist');
    }).not.toThrow();

    expect(localStorage.removeItem).toHaveBeenCalledWith('does-not-exist');
  });
});
