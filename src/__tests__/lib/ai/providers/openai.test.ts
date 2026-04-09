import type { AIProviderDefinition } from '@/types/ai';

vi.mock('@/lib/uuid', () => ({
  generateId: vi.fn(() => 'test-uuid'),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import after mock setup
let openaiProvider: AIProviderDefinition;

beforeAll(async () => {
  const mod = await import('@/lib/ai/providers/openai');
  openaiProvider = mod.openaiProvider;
});

describe('openaiProvider', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  // --- Metadata ---
  it('has correct provider metadata', () => {
    expect(openaiProvider.id).toBe('openai');
    expect(openaiProvider.name).toBe('OpenAI');
    expect(openaiProvider.defaultModel).toBe('gpt-5-mini');
    expect(openaiProvider.apiKeyPlaceholder).toBe('sk-...');
    expect(openaiProvider.apiKeyHelpUrl).toBeTruthy();
  });

  // --- generateSuggestions ---
  describe('generateSuggestions', () => {
    it('calls OpenAI chat completions endpoint with correct params', async () => {
      const suggestions = [{ suggestion: 'Improved', category: 'rewrite' }];
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          choices: [{ message: { content: JSON.stringify(suggestions) } }],
        }),
      });

      await openaiProvider.generateSuggestions('sk-key', 'gpt-5-mini', 'experience', 'My text');

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.openai.com/v1/chat/completions');
      expect(options.headers.Authorization).toBe('Bearer sk-key');
      const body = JSON.parse(options.body);
      expect(body.model).toBe('gpt-5-mini');
    });

    it('returns parsed suggestions from choices format', async () => {
      const suggestions = [
        { suggestion: 'Better text', category: 'rewrite' },
        { suggestion: 'Stronger verbs', category: 'action-verb' },
      ];
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          choices: [{ message: { content: JSON.stringify(suggestions) } }],
        }),
      });

      const result = await openaiProvider.generateSuggestions('sk-key', 'gpt-5-mini', 'experience', 'My text');
      expect(result).toHaveLength(2);
      expect(result[0].suggestion).toBe('Better text');
    });

    it('handles output_text format', async () => {
      const suggestions = [{ suggestion: 'Output text', category: 'quantify' }];
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          output_text: JSON.stringify(suggestions),
        }),
      });

      const result = await openaiProvider.generateSuggestions('sk-key', 'gpt-5-mini', 'summary', 'text');
      expect(result).toHaveLength(1);
      expect(result[0].suggestion).toBe('Output text');
    });

    it('handles output array format', async () => {
      const suggestions = [{ suggestion: 'Array format', category: 'concise' }];
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          output: [{ content: [{ text: JSON.stringify(suggestions) }] }],
        }),
      });

      const result = await openaiProvider.generateSuggestions('sk-key', 'gpt-5-mini', 'skills', 'text');
      expect(result).toHaveLength(1);
      expect(result[0].suggestion).toBe('Array format');
    });

    it('throws AIError with code "network" on fetch failure', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      const { AIError } = await import('@/lib/ai/utils');
      await expect(
        openaiProvider.generateSuggestions('sk-key', 'gpt-5-mini', 'experience', 'text')
      ).rejects.toThrow(AIError);
    });

    it('throws AIError with code "unauthorized" on 401', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 401, json: vi.fn().mockResolvedValue({}) });

      const { AIError } = await import('@/lib/ai/utils');
      try {
        await openaiProvider.generateSuggestions('sk-key', 'gpt-5-mini', 'experience', 'text');
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
        await openaiProvider.generateSuggestions('sk-key', 'gpt-5-mini', 'experience', 'text');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AIError);
        expect((err as InstanceType<typeof AIError>).code).toBe('rate_limit');
      }
    });
  });

  // --- fetchModels ---
  describe('fetchModels', () => {
    it('calls OpenAI models endpoint and returns filtered models', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          data: [
            { id: 'gpt-5-mini', owned_by: 'openai' },
            { id: 'gpt-5.4', owned_by: 'openai' },
            { id: 'dall-e-3', owned_by: 'openai' },
            { id: 'text-embedding-3-small', owned_by: 'openai' },
          ],
        }),
      });

      const models = await openaiProvider.fetchModels('sk-key');

      expect(mockFetch).toHaveBeenCalledWith('https://api.openai.com/v1/models', {
        headers: { Authorization: 'Bearer sk-key' },
      });
      // Should filter to only gpt-* models
      const ids = models.map((m) => m.id);
      expect(ids).toContain('gpt-5-mini');
      expect(ids).toContain('gpt-5.4');
      expect(ids).not.toContain('dall-e-3');
      expect(ids).not.toContain('text-embedding-3-small');
    });

    it('throws AIError on 401', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 401, json: vi.fn().mockResolvedValue({}) });

      const { AIError } = await import('@/lib/ai/utils');
      await expect(openaiProvider.fetchModels('bad-key')).rejects.toThrow(AIError);
    });
  });
});
