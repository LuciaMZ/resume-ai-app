import type { AIProviderDefinition } from '@/types/ai';

vi.mock('@/lib/uuid', () => ({
  generateId: vi.fn(() => 'test-uuid'),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

let geminiProvider: AIProviderDefinition;

beforeAll(async () => {
  const mod = await import('@/lib/ai/providers/gemini');
  geminiProvider = mod.geminiProvider;
});

describe('geminiProvider', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  // --- Metadata ---
  it('has correct provider metadata', () => {
    expect(geminiProvider.id).toBe('gemini');
    expect(geminiProvider.name).toBe('Google Gemini');
    expect(geminiProvider.defaultModel).toBeTruthy();
    expect(geminiProvider.apiKeyPlaceholder).toBeTruthy();
    expect(geminiProvider.apiKeyHelpUrl).toBeTruthy();
  });

  // --- generateSuggestions ---
  describe('generateSuggestions', () => {
    it('calls Gemini generateContent endpoint with correct params', async () => {
      const suggestions = [{ suggestion: 'Gemini improved', category: 'rewrite' }];
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify(suggestions) }],
            },
          }],
        }),
      });

      await geminiProvider.generateSuggestions('AIza-key', 'gemini-2.0-flash', 'experience', 'My text');

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('generativelanguage.googleapis.com');
      expect(url).toContain('gemini-2.0-flash');
      expect(url).toContain('generateContent');
      expect(url).toContain('key=AIza-key');
      const body = JSON.parse(options.body);
      expect(body.contents).toBeDefined();
    });

    it('returns parsed suggestions', async () => {
      const suggestions = [
        { suggestion: 'Better text', category: 'rewrite' },
        { suggestion: 'More concise', category: 'concise' },
      ];
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          candidates: [{
            content: { parts: [{ text: JSON.stringify(suggestions) }] },
          }],
        }),
      });

      const result = await geminiProvider.generateSuggestions('AIza-key', 'gemini-2.0-flash', 'experience', 'text');
      expect(result).toHaveLength(2);
      expect(result[0].suggestion).toBe('Better text');
      expect(result[1].category).toBe('concise');
    });

    it('throws AIError with code "network" on fetch failure', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      const { AIError } = await import('@/lib/ai/utils');
      await expect(
        geminiProvider.generateSuggestions('key', 'gemini-2.0-flash', 'experience', 'text')
      ).rejects.toThrow(AIError);
    });

    it('throws AIError with code "unauthorized" on 401/403', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 403, json: vi.fn().mockResolvedValue({}) });

      const { AIError } = await import('@/lib/ai/utils');
      try {
        await geminiProvider.generateSuggestions('key', 'gemini-2.0-flash', 'experience', 'text');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AIError);
        expect((err as InstanceType<typeof AIError>).code).toBe('unauthorized');
      }
    });

    it('throws AIError with code "rate_limit" on 429', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 429, json: vi.fn().mockResolvedValue({}) });

      const { AIError } = await import('@/lib/ai/utils');
      try {
        await geminiProvider.generateSuggestions('key', 'gemini-2.0-flash', 'experience', 'text');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AIError);
        expect((err as InstanceType<typeof AIError>).code).toBe('rate_limit');
      }
    });

    it('throws AIError when response has no candidates', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ candidates: [] }),
      });

      const { AIError } = await import('@/lib/ai/utils');
      await expect(
        geminiProvider.generateSuggestions('key', 'gemini-2.0-flash', 'experience', 'text')
      ).rejects.toThrow(AIError);
    });
  });

  // --- fetchModels ---
  describe('fetchModels', () => {
    it('calls Gemini models endpoint and returns filtered models', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          models: [
            { name: 'models/gemini-2.0-flash', displayName: 'Gemini 2.0 Flash', supportedGenerationMethods: ['generateContent'] },
            { name: 'models/gemini-2.5-pro', displayName: 'Gemini 2.5 Pro', supportedGenerationMethods: ['generateContent'] },
            { name: 'models/text-embedding-004', displayName: 'Text Embedding', supportedGenerationMethods: ['embedContent'] },
          ],
        }),
      });

      const models = await geminiProvider.fetchModels('AIza-key');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('generativelanguage.googleapis.com'),
        expect.any(Object)
      );
      const ids = models.map((m) => m.id);
      expect(ids).toContain('gemini-2.0-flash');
      expect(ids).toContain('gemini-2.5-pro');
      expect(ids).not.toContain('text-embedding-004');
    });

    it('throws AIError on 401/403', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 403, json: vi.fn().mockResolvedValue({}) });

      const { AIError } = await import('@/lib/ai/utils');
      await expect(geminiProvider.fetchModels('bad-key')).rejects.toThrow(AIError);
    });
  });
});
