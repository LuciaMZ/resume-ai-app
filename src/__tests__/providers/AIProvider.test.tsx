import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AIProvider } from '@/providers/AIProvider';
import { useAIConfig } from '@/hooks/useAIConfig';
import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  STORAGE_KEYS,
} from '@/lib/storage';
import { migrateAIConfig } from '@/lib/ai';
import type { AIConfig, ProviderConfig } from '@/types/ai';

vi.mock('@/lib/storage', () => ({
  getStorageItem: vi.fn(),
  setStorageItem: vi.fn(),
  removeStorageItem: vi.fn(),
  STORAGE_KEYS: { AI_CONFIG: 'resumeAIapp:ai-config' },
}));

vi.mock('@/lib/ai', () => ({
  migrateAIConfig: vi.fn(),
}));

const mockedGetStorageItem = vi.mocked(getStorageItem);
const mockedSetStorageItem = vi.mocked(setStorageItem);
const mockedRemoveStorageItem = vi.mocked(removeStorageItem);
const mockedMigrateAIConfig = vi.mocked(migrateAIConfig);

function wrapper({ children }: { children: ReactNode }) {
  return <AIProvider>{children}</AIProvider>;
}

const testProviderConfig: ProviderConfig = {
  apiKey: 'sk-test-key-12345',
  model: 'gpt-5-mini',
};

const testAIConfig: AIConfig = {
  activeProvider: 'openai',
  providers: {
    openai: testProviderConfig,
  },
};

describe('AIProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetStorageItem.mockReturnValue(null);
    mockedMigrateAIConfig.mockReturnValue(null);
  });

  it('initially has aiConfig as null and isAIEnabled as false', () => {
    const { result } = renderHook(() => useAIConfig(), { wrapper });

    expect(result.current.aiConfig).toBeNull();
    expect(result.current.isAIEnabled).toBe(false);
  });

  it('setProviderConfig saves config, sets active provider, and persists to localStorage', () => {
    const { result } = renderHook(() => useAIConfig(), { wrapper });

    act(() => {
      result.current.setProviderConfig('openai', testProviderConfig);
    });

    expect(result.current.aiConfig).toEqual(testAIConfig);
    expect(mockedSetStorageItem).toHaveBeenCalledWith(
      STORAGE_KEYS.AI_CONFIG,
      testAIConfig
    );
  });

  it('clearProviderConfig removes provider and clears storage when no providers remain', () => {
    const { result } = renderHook(() => useAIConfig(), { wrapper });

    // First set a provider config
    act(() => {
      result.current.setProviderConfig('openai', testProviderConfig);
    });

    expect(result.current.aiConfig).toEqual(testAIConfig);

    // Then clear it
    act(() => {
      result.current.clearProviderConfig('openai');
    });

    expect(result.current.aiConfig).toBeNull();
    expect(mockedRemoveStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.AI_CONFIG);
  });

  it('clearProviderConfig switches active provider when clearing the active one with remaining providers', () => {
    const { result } = renderHook(() => useAIConfig(), { wrapper });

    const geminiConfig: ProviderConfig = {
      apiKey: 'gemini-key-12345',
      model: 'gemini-pro',
    };

    // Set up two providers
    act(() => {
      result.current.setProviderConfig('openai', testProviderConfig);
    });
    act(() => {
      result.current.setProviderConfig('gemini', geminiConfig);
    });

    // Active provider should be gemini (last set)
    expect(result.current.aiConfig?.activeProvider).toBe('gemini');

    // Clear the active provider (gemini)
    act(() => {
      result.current.clearProviderConfig('gemini');
    });

    // Should fall back to the remaining provider
    expect(result.current.aiConfig?.activeProvider).toBe('openai');
    expect(result.current.aiConfig?.providers).toEqual({
      openai: testProviderConfig,
    });
  });

  it('isAIEnabled is true when active provider has a valid key', () => {
    const { result } = renderHook(() => useAIConfig(), { wrapper });

    act(() => {
      result.current.setProviderConfig('openai', testProviderConfig);
    });

    expect(result.current.isAIEnabled).toBe(true);
  });

  it('isAIEnabled is false when aiConfig is null', () => {
    const { result } = renderHook(() => useAIConfig(), { wrapper });

    expect(result.current.isAIEnabled).toBe(false);
  });

  it('isAIEnabled is false when active provider has an empty apiKey', () => {
    const { result } = renderHook(() => useAIConfig(), { wrapper });

    act(() => {
      result.current.setProviderConfig('openai', { apiKey: '', model: 'gpt-5-mini' });
    });

    expect(result.current.isAIEnabled).toBe(false);
  });

  it('loads existing config from localStorage on mount via migrateAIConfig', () => {
    mockedGetStorageItem.mockReturnValue(testAIConfig);
    mockedMigrateAIConfig.mockReturnValue(testAIConfig);

    const { result } = renderHook(() => useAIConfig(), { wrapper });

    // After hydration useEffect runs, config should be loaded
    expect(result.current.aiConfig).toEqual(testAIConfig);
    expect(mockedGetStorageItem).toHaveBeenCalledWith(STORAGE_KEYS.AI_CONFIG);
    expect(mockedMigrateAIConfig).toHaveBeenCalledWith(testAIConfig);
  });

  it('migrates legacy config format on mount', () => {
    const legacyConfig = { apiKey: 'sk-test-key-12345', model: 'gpt-5-mini' };
    mockedGetStorageItem.mockReturnValue(legacyConfig);
    mockedMigrateAIConfig.mockReturnValue(testAIConfig);

    const { result } = renderHook(() => useAIConfig(), { wrapper });

    expect(mockedMigrateAIConfig).toHaveBeenCalledWith(legacyConfig);
    expect(result.current.aiConfig).toEqual(testAIConfig);
    // Migrated format should be persisted back to storage
    expect(mockedSetStorageItem).toHaveBeenCalledWith(
      STORAGE_KEYS.AI_CONFIG,
      testAIConfig
    );
  });

  it('does not load config when migrateAIConfig returns null', () => {
    mockedGetStorageItem.mockReturnValue({ apiKey: '' });
    mockedMigrateAIConfig.mockReturnValue(null);

    const { result } = renderHook(() => useAIConfig(), { wrapper });

    expect(result.current.aiConfig).toBeNull();
  });

  it('setActiveProvider changes the active provider without modifying configs', () => {
    const { result } = renderHook(() => useAIConfig(), { wrapper });

    const geminiConfig: ProviderConfig = {
      apiKey: 'gemini-key-12345',
      model: 'gemini-pro',
    };

    // Set up two providers
    act(() => {
      result.current.setProviderConfig('openai', testProviderConfig);
    });
    act(() => {
      result.current.setProviderConfig('gemini', geminiConfig);
    });

    // Active is gemini (last set)
    expect(result.current.aiConfig?.activeProvider).toBe('gemini');

    // Switch active back to openai
    act(() => {
      result.current.setActiveProvider('openai');
    });

    expect(result.current.aiConfig?.activeProvider).toBe('openai');
    // Both provider configs should remain intact
    expect(result.current.aiConfig?.providers).toEqual({
      openai: testProviderConfig,
      gemini: geminiConfig,
    });
  });

  it('setActiveProvider is a no-op when aiConfig is null', () => {
    const { result } = renderHook(() => useAIConfig(), { wrapper });

    act(() => {
      result.current.setActiveProvider('openai');
    });

    expect(result.current.aiConfig).toBeNull();
    expect(mockedSetStorageItem).not.toHaveBeenCalled();
  });

  it('clearProviderConfig is a no-op when aiConfig is null', () => {
    const { result } = renderHook(() => useAIConfig(), { wrapper });

    act(() => {
      result.current.clearProviderConfig('openai');
    });

    expect(result.current.aiConfig).toBeNull();
    expect(mockedRemoveStorageItem).not.toHaveBeenCalled();
  });

  it('useAIConfig throws when used outside AIProvider', () => {
    // Suppress console.error from React when the error boundary catches
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAIConfig());
    }).toThrow('useAIConfig must be used within an <AIProvider>');

    errorSpy.mockRestore();
  });
});
