# Multi-Provider AI Abstraction Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Abstract the AI suggestion system to support multiple providers (OpenAI, Gemini, and future providers) via a pluggable registry, with per-provider API key management and dynamic model fetching.

**Architecture:** Create a provider interface (`AIProviderDefinition`) with a registry pattern (like the existing template registry). Each provider implements `generateSuggestions()` and `fetchModels()`. Shared logic (prompts, parsing, HTML stripping, error class) lives in common utils. The `AIConfig` type changes to support multiple providers with per-provider keys and cached model lists. The settings modal gets a provider selector dropdown that adapts fields dynamically.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, Tailwind CSS 4

**Design doc:** `docs/plans/2026-03-07-multi-provider-ai-design.md`

---

## Task 1: Update AI Types

**Files:**
- Modify: `src/types/ai.ts`

**Step 1: Update the type definitions**

Replace the contents of `src/types/ai.ts` with:

```typescript
import type { SectionType } from './resume';

/** A single AI-generated suggestion */
export interface AISuggestion {
  id: string;
  sectionId: string;
  sectionType: SectionType;
  originalText: string;
  suggestion: string;
  category: SuggestionCategory;
  timestamp: string;
}

/** Categories of AI suggestions */
export type SuggestionCategory =
  | 'rewrite'
  | 'action-verb'
  | 'quantify'
  | 'ats-optimize'
  | 'concise';

/** A model available from an AI provider */
export interface AIModel {
  id: string;
  name: string;
}

/** Per-provider configuration (key, model, cached models) */
export interface ProviderConfig {
  apiKey: string;
  model: string;
  cachedModels?: AIModel[];
}

/** Multi-provider AI configuration stored in localStorage */
export interface AIConfig {
  activeProvider: string;
  providers: Record<string, ProviderConfig>;
}

/** Legacy AIConfig format for migration */
export interface LegacyAIConfig {
  apiKey: string;
  model?: string;
}

/** Definition that each AI provider must implement */
export interface AIProviderDefinition {
  id: string;
  name: string;
  defaultModel: string;
  apiKeyPlaceholder: string;
  apiKeyHelpUrl: string;

  generateSuggestions(
    apiKey: string,
    model: string,
    sectionType: SectionType,
    content: string
  ): Promise<AISuggestion[]>;

  fetchModels(apiKey: string): Promise<AIModel[]>;
}
```

**Step 2: Verify the project compiles**

Run: `npx tsc --noEmit 2>&1 | head -30`
Expected: Type errors in files that import old `AIConfig` shape — this is expected and will be fixed in subsequent tasks.

**Step 3: Commit**

```bash
git add src/types/ai.ts
git commit -m "feat(ai): update types for multi-provider support

Add AIProviderDefinition, ProviderConfig, AIModel, and LegacyAIConfig
types. Restructure AIConfig to support multiple providers with
per-provider API keys and cached model lists."
```

---

## Task 2: Extract Shared AI Utilities

**Files:**
- Create: `src/lib/ai/utils.ts`
- Create: `src/lib/ai/prompts.ts`
- Create: `src/__tests__/lib/ai/utils.test.ts`

**Step 1: Create `src/lib/ai/prompts.ts`**

Extract `buildSystemPrompt` from `src/lib/ai.ts` (lines 47-68):

```typescript
import type { SectionType } from '@/types/resume';

export function buildSystemPrompt(sectionType: SectionType): string {
  return `You are a professional resume writing assistant. The user is editing the "${sectionType}" section of their resume. Analyze the provided text and generate 3 improved versions.

For each suggestion:
- Use strong action verbs
- Quantify achievements where possible
- Use concise, professional language
- Optimize for ATS (Applicant Tracking Systems)
- Keep the same general meaning but improve impact

Respond as a JSON array of objects with "suggestion" and "category" fields.
Categories: "rewrite", "action-verb", "quantify", "ats-optimize", "concise"

Example response format:
[
  {"suggestion": "Improved text here", "category": "rewrite"},
  {"suggestion": "Another improvement", "category": "action-verb"},
  {"suggestion": "Third version", "category": "quantify"}
]

Respond ONLY with the JSON array, no additional text.`;
}
```

**Step 2: Create `src/lib/ai/utils.ts`**

Extract `stripHtml`, `AIError`, parsing logic, and constants from `src/lib/ai.ts`:

```typescript
import type { AISuggestion, SuggestionCategory } from '@/types/ai';
import type { SectionType } from '@/types/resume';
import { generateId } from '@/lib/uuid';

// =============================================================================
// HTML Stripping
// =============================================================================

export function stripHtml(html: string): string {
  if (!html) return '';

  if (typeof document !== 'undefined') {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent ?? '';
  }

  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// =============================================================================
// Error Types
// =============================================================================

export class AIError extends Error {
  constructor(
    message: string,
    public readonly code: 'unauthorized' | 'rate_limit' | 'network' | 'parse' | 'unknown'
  ) {
    super(message);
    this.name = 'AIError';
  }
}

// =============================================================================
// Suggestion Parsing
// =============================================================================

interface RawSuggestion {
  suggestion: string;
  category: SuggestionCategory;
}

const VALID_CATEGORIES: SuggestionCategory[] = [
  'rewrite',
  'action-verb',
  'quantify',
  'ats-optimize',
  'concise',
];

/**
 * Parse a JSON string (possibly wrapped in markdown code fences)
 * into an array of AISuggestion objects.
 */
export function parseSuggestions(
  raw: string,
  sectionType: SectionType,
  originalText: string
): AISuggestion[] {
  let parsed: RawSuggestion[];
  try {
    const cleaned = raw
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new AIError('Failed to parse AI response. Please try again.', 'parse');
  }

  if (!Array.isArray(parsed)) {
    throw new AIError('Failed to parse AI response. Please try again.', 'parse');
  }

  const now = new Date().toISOString();
  return parsed
    .filter(
      (item) =>
        typeof item.suggestion === 'string' &&
        item.suggestion.length > 0 &&
        typeof item.category === 'string'
    )
    .map((item) => ({
      id: generateId(),
      sectionId: '',
      sectionType,
      originalText,
      suggestion: item.suggestion,
      category: VALID_CATEGORIES.includes(item.category)
        ? item.category
        : 'rewrite',
      timestamp: now,
    }));
}
```

**Step 3: Create `src/__tests__/lib/ai/utils.test.ts`**

Move the `stripHtml`, `AIError`, and parsing-related tests from the existing `src/__tests__/lib/ai.test.ts` into this new file. These tests exercise the shared utilities that are now provider-agnostic:

```typescript
import { stripHtml, AIError, parseSuggestions } from '@/lib/ai/utils';

vi.mock('@/lib/uuid', () => ({
  generateId: vi.fn(() => 'test-uuid'),
}));

// ---------------------------------------------------------------------------
// stripHtml
// ---------------------------------------------------------------------------

describe('stripHtml', () => {
  it('returns empty string for empty input', () => {
    expect(stripHtml('')).toBe('');
  });

  it('returns empty string for falsy input', () => {
    expect(stripHtml(undefined as any)).toBe('');
    expect(stripHtml(null as any)).toBe('');
  });

  it('strips HTML tags', () => {
    const result = stripHtml('<p>Hello <strong>World</strong></p>');
    expect(result).toBe('Hello World');
  });

  it('handles nested HTML tags', () => {
    const result = stripHtml('<div><ul><li>Item 1</li><li>Item 2</li></ul></div>');
    expect(result).toContain('Item 1');
    expect(result).toContain('Item 2');
  });

  it('handles plain text input without tags', () => {
    expect(stripHtml('Just plain text')).toBe('Just plain text');
  });

  it('decodes &amp; entity', () => {
    const result = stripHtml('<p>Tom &amp; Jerry</p>');
    expect(result).toContain('Tom');
    expect(result).toContain('Jerry');
    expect(result).toContain('&');
  });

  it('decodes &lt; and &gt; entities', () => {
    const result = stripHtml('<p>&lt;div&gt;</p>');
    expect(result).toContain('<div>');
  });

  it('decodes &quot; entity', () => {
    const result = stripHtml('<p>&quot;hello&quot;</p>');
    expect(result).toContain('"hello"');
  });

  it('decodes &#39; entity', () => {
    const result = stripHtml("<p>it&#39;s</p>");
    expect(result).toContain("it's");
  });

  it('collapses whitespace and trims', () => {
    const result = stripHtml('<p>  lots   of   spaces  </p>');
    expect(result).toContain('lots   of   spaces');
  });
});

// ---------------------------------------------------------------------------
// AIError
// ---------------------------------------------------------------------------

describe('AIError', () => {
  it('has the correct name', () => {
    const err = new AIError('test message', 'network');
    expect(err.name).toBe('AIError');
  });

  it('has the correct message', () => {
    const err = new AIError('something went wrong', 'unknown');
    expect(err.message).toBe('something went wrong');
  });

  it('has the correct code', () => {
    const codes = ['unauthorized', 'rate_limit', 'network', 'parse', 'unknown'] as const;
    for (const code of codes) {
      const err = new AIError('msg', code);
      expect(err.code).toBe(code);
    }
  });

  it('is an instance of Error', () => {
    const err = new AIError('msg', 'parse');
    expect(err).toBeInstanceOf(Error);
  });

  it('is an instance of AIError', () => {
    const err = new AIError('msg', 'parse');
    expect(err).toBeInstanceOf(AIError);
  });
});

// ---------------------------------------------------------------------------
// parseSuggestions
// ---------------------------------------------------------------------------

describe('parseSuggestions', () => {
  it('parses valid JSON array of suggestions', () => {
    const raw = JSON.stringify([
      { suggestion: 'Better text', category: 'rewrite' },
      { suggestion: 'Stronger verbs', category: 'action-verb' },
    ]);

    const result = parseSuggestions(raw, 'experience', 'original');

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: 'test-uuid',
      sectionId: '',
      sectionType: 'experience',
      originalText: 'original',
      suggestion: 'Better text',
      category: 'rewrite',
    });
    expect(result[0].timestamp).toBeTruthy();
  });

  it('strips markdown code fences', () => {
    const suggestions = [{ suggestion: 'Fenced', category: 'rewrite' }];
    const raw = '```json\n' + JSON.stringify(suggestions) + '\n```';

    const result = parseSuggestions(raw, 'experience', 'text');
    expect(result).toHaveLength(1);
    expect(result[0].suggestion).toBe('Fenced');
  });

  it('filters out entries without valid suggestion string', () => {
    const raw = JSON.stringify([
      { suggestion: 'Valid one', category: 'rewrite' },
      { suggestion: '', category: 'rewrite' },
      { suggestion: 123, category: 'rewrite' },
      { category: 'rewrite' },
      { suggestion: 'Valid two', category: 'quantify' },
    ]);

    const result = parseSuggestions(raw, 'experience', 'text');
    expect(result).toHaveLength(2);
    expect(result[0].suggestion).toBe('Valid one');
    expect(result[1].suggestion).toBe('Valid two');
  });

  it('maps invalid categories to "rewrite"', () => {
    const raw = JSON.stringify([
      { suggestion: 'Good', category: 'invented-category' },
      { suggestion: 'Another', category: 'ats-optimize' },
    ]);

    const result = parseSuggestions(raw, 'experience', 'text');
    expect(result[0].category).toBe('rewrite');
    expect(result[1].category).toBe('ats-optimize');
  });

  it('throws AIError on invalid JSON', () => {
    expect(() => parseSuggestions('not json', 'experience', 'text'))
      .toThrow(AIError);
  });

  it('throws AIError when parsed result is not an array', () => {
    expect(() => parseSuggestions('{"not": "array"}', 'experience', 'text'))
      .toThrow(AIError);
  });
});
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/lib/ai/utils.test.ts`
Expected: All tests PASS.

**Step 5: Commit**

```bash
git add src/lib/ai/utils.ts src/lib/ai/prompts.ts src/__tests__/lib/ai/utils.test.ts
git commit -m "refactor(ai): extract shared utilities and prompts

Move stripHtml, AIError, parseSuggestions to lib/ai/utils.ts and
buildSystemPrompt to lib/ai/prompts.ts. Add comprehensive tests
for the shared utilities."
```

---

## Task 3: Create Provider Registry

**Files:**
- Create: `src/lib/ai/registry.ts`

**Step 1: Create the registry module**

```typescript
import type { AIProviderDefinition } from '@/types/ai';

const registry: Record<string, AIProviderDefinition> = {};

export function registerProvider(provider: AIProviderDefinition): void {
  registry[provider.id] = provider;
}

export function getProvider(id: string): AIProviderDefinition | undefined {
  return registry[id];
}

export function getAllProviders(): AIProviderDefinition[] {
  return Object.values(registry);
}
```

**Step 2: Commit**

```bash
git add src/lib/ai/registry.ts
git commit -m "feat(ai): add provider registry

Simple registry for AI providers, following the same pattern as
the template registry."
```

---

## Task 4: Implement OpenAI Provider

**Files:**
- Create: `src/lib/ai/providers/openai.ts`
- Create: `src/__tests__/lib/ai/providers/openai.test.ts`

**Step 1: Write the failing tests**

```typescript
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
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/lib/ai/providers/openai.test.ts`
Expected: FAIL — module not found.

**Step 3: Implement the OpenAI provider**

Create `src/lib/ai/providers/openai.ts`:

```typescript
import type { AIProviderDefinition, AISuggestion, AIModel } from '@/types/ai';
import type { SectionType } from '@/types/resume';
import { AIError, parseSuggestions } from '@/lib/ai/utils';
import { buildSystemPrompt } from '@/lib/ai/prompts';

function extractMessageContent(responseData: Record<string, unknown>): string {
  // Try output_text (newer format)
  if (typeof responseData.output_text === 'string') {
    return responseData.output_text;
  }
  // Try choices format (legacy)
  if (Array.isArray(responseData.choices)) {
    const choices = responseData.choices as { message?: { content?: string } }[];
    return choices[0]?.message?.content ?? '';
  }
  // Try output array format (newer)
  if (Array.isArray(responseData.output)) {
    const output = responseData.output as { content?: { text?: string }[] | string }[];
    for (const item of output) {
      if (typeof item.content === 'string') return item.content;
      if (Array.isArray(item.content)) {
        for (const block of item.content) {
          if (typeof block === 'object' && block && 'text' in block && typeof block.text === 'string') {
            return block.text;
          }
        }
      }
    }
  }
  return '';
}

export const openaiProvider: AIProviderDefinition = {
  id: 'openai',
  name: 'OpenAI',
  defaultModel: 'gpt-5-mini',
  apiKeyPlaceholder: 'sk-...',
  apiKeyHelpUrl: 'https://platform.openai.com/api-keys',

  async generateSuggestions(
    apiKey: string,
    model: string,
    sectionType: SectionType,
    content: string
  ): Promise<AISuggestion[]> {
    const systemPrompt = buildSystemPrompt(sectionType);

    let response: Response;
    try {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content },
          ],
          max_completion_tokens: 4096,
        }),
      });
    } catch {
      throw new AIError(
        'Could not connect to OpenAI. Check your internet connection.',
        'network'
      );
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new AIError('Invalid API key. Please check your key in Settings.', 'unauthorized');
      }
      if (response.status === 429) {
        throw new AIError('Rate limit exceeded. Please wait a moment and try again.', 'rate_limit');
      }
      throw new AIError(`OpenAI API error (${response.status}). Please try again.`, 'unknown');
    }

    let responseData: Record<string, unknown>;
    try {
      responseData = await response.json();
    } catch {
      throw new AIError('Failed to parse AI response. Please try again.', 'parse');
    }

    const messageContent = extractMessageContent(responseData);
    if (!messageContent) {
      throw new AIError('Unexpected AI response format. Please try again.', 'parse');
    }

    return parseSuggestions(messageContent, sectionType, content);
  },

  async fetchModels(apiKey: string): Promise<AIModel[]> {
    let response: Response;
    try {
      response = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
    } catch {
      throw new AIError('Could not connect to OpenAI.', 'network');
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new AIError('Invalid API key.', 'unauthorized');
      }
      throw new AIError(`OpenAI API error (${response.status}).`, 'unknown');
    }

    const data = await response.json();
    const models = (data.data as { id: string }[])
      .filter((m) => m.id.startsWith('gpt-'))
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((m) => ({ id: m.id, name: m.id }));

    return models;
  },
};
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/lib/ai/providers/openai.test.ts`
Expected: All tests PASS.

**Step 5: Commit**

```bash
git add src/lib/ai/providers/openai.ts src/__tests__/lib/ai/providers/openai.test.ts
git commit -m "feat(ai): implement OpenAI provider

Refactor existing OpenAI logic into the AIProviderDefinition
interface. Add fetchModels support via /v1/models endpoint.
Comprehensive tests for suggestions and model fetching."
```

---

## Task 5: Implement Gemini Provider

**Files:**
- Create: `src/lib/ai/providers/gemini.ts`
- Create: `src/__tests__/lib/ai/providers/gemini.test.ts`

**Step 1: Write the failing tests**

```typescript
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
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/lib/ai/providers/gemini.test.ts`
Expected: FAIL — module not found.

**Step 3: Implement the Gemini provider**

Create `src/lib/ai/providers/gemini.ts`:

```typescript
import type { AIProviderDefinition, AISuggestion, AIModel } from '@/types/ai';
import type { SectionType } from '@/types/resume';
import { AIError, parseSuggestions } from '@/lib/ai/utils';
import { buildSystemPrompt } from '@/lib/ai/prompts';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export const geminiProvider: AIProviderDefinition = {
  id: 'gemini',
  name: 'Google Gemini',
  defaultModel: 'gemini-2.0-flash',
  apiKeyPlaceholder: 'AIza...',
  apiKeyHelpUrl: 'https://aistudio.google.com/apikey',

  async generateSuggestions(
    apiKey: string,
    model: string,
    sectionType: SectionType,
    content: string
  ): Promise<AISuggestion[]> {
    const systemPrompt = buildSystemPrompt(sectionType);

    let response: Response;
    try {
      response = await fetch(
        `${GEMINI_BASE}/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: systemPrompt }],
            },
            contents: [
              {
                role: 'user',
                parts: [{ text: content }],
              },
            ],
            generationConfig: {
              maxOutputTokens: 4096,
              responseMimeType: 'application/json',
            },
          }),
        }
      );
    } catch {
      throw new AIError(
        'Could not connect to Google Gemini. Check your internet connection.',
        'network'
      );
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new AIError('Invalid API key. Please check your key in Settings.', 'unauthorized');
      }
      if (response.status === 429) {
        throw new AIError('Rate limit exceeded. Please wait a moment and try again.', 'rate_limit');
      }
      throw new AIError(`Gemini API error (${response.status}). Please try again.`, 'unknown');
    }

    let responseData: Record<string, unknown>;
    try {
      responseData = await response.json();
    } catch {
      throw new AIError('Failed to parse AI response. Please try again.', 'parse');
    }

    // Extract text from candidates[0].content.parts[0].text
    const candidates = responseData.candidates as
      | { content?: { parts?: { text?: string }[] } }[]
      | undefined;

    const text = candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new AIError('Unexpected AI response format. Please try again.', 'parse');
    }

    return parseSuggestions(text, sectionType, content);
  },

  async fetchModels(apiKey: string): Promise<AIModel[]> {
    let response: Response;
    try {
      response = await fetch(`${GEMINI_BASE}/models?key=${apiKey}`, {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      throw new AIError('Could not connect to Google Gemini.', 'network');
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new AIError('Invalid API key.', 'unauthorized');
      }
      throw new AIError(`Gemini API error (${response.status}).`, 'unknown');
    }

    const data = await response.json();
    const models = (
      data.models as {
        name: string;
        displayName: string;
        supportedGenerationMethods: string[];
      }[]
    )
      .filter((m) => m.supportedGenerationMethods.includes('generateContent'))
      .map((m) => ({
        id: m.name.replace('models/', ''),
        name: m.displayName,
      }))
      .sort((a, b) => a.id.localeCompare(b.id));

    return models;
  },
};
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/lib/ai/providers/gemini.test.ts`
Expected: All tests PASS.

**Step 5: Commit**

```bash
git add src/lib/ai/providers/gemini.ts src/__tests__/lib/ai/providers/gemini.test.ts
git commit -m "feat(ai): implement Gemini provider

Add Google Gemini provider using native generateContent API.
Includes model fetching via /v1beta/models endpoint filtered
to generateContent-capable models."
```

---

## Task 6: Create Main AI Entry Point and Register Providers

**Files:**
- Create: `src/lib/ai/index.ts`

**Step 1: Create the main entry point**

This module registers all providers and exports a `generateSuggestions` function that delegates to the active provider. It also exports everything consumers need from one import path.

```typescript
import type { AIConfig, AISuggestion, AIModel, LegacyAIConfig } from '@/types/ai';
import type { SectionType } from '@/types/resume';
import { registerProvider, getProvider, getAllProviders } from './registry';
import { openaiProvider } from './providers/openai';
import { geminiProvider } from './providers/gemini';

// Re-export shared utilities for external consumers
export { AIError, stripHtml } from './utils';
export { getProvider, getAllProviders } from './registry';
export type { AIProviderDefinition, AIModel } from '@/types/ai';

// Register built-in providers
registerProvider(openaiProvider);
registerProvider(geminiProvider);

/**
 * Generate AI suggestions using the active provider from the config.
 */
export async function generateSuggestions(
  config: AIConfig,
  sectionType: SectionType,
  content: string
): Promise<AISuggestion[]> {
  const provider = getProvider(config.activeProvider);
  if (!provider) {
    throw new Error(`Unknown AI provider: ${config.activeProvider}`);
  }

  const providerConfig = config.providers[config.activeProvider];
  if (!providerConfig?.apiKey) {
    throw new Error('No API key configured for the active provider.');
  }

  const model = providerConfig.model || provider.defaultModel;
  return provider.generateSuggestions(providerConfig.apiKey, model, sectionType, content);
}

/**
 * Fetch available models for a specific provider.
 */
export async function fetchProviderModels(
  providerId: string,
  apiKey: string
): Promise<AIModel[]> {
  const provider = getProvider(providerId);
  if (!provider) {
    throw new Error(`Unknown AI provider: ${providerId}`);
  }
  return provider.fetchModels(apiKey);
}

/**
 * Migrate legacy AIConfig (single provider) to multi-provider format.
 * Returns null if the input is already in the new format or invalid.
 */
export function migrateAIConfig(stored: unknown): AIConfig | null {
  if (!stored || typeof stored !== 'object') return null;

  const obj = stored as Record<string, unknown>;

  // Already new format
  if ('activeProvider' in obj && 'providers' in obj) {
    return obj as unknown as AIConfig;
  }

  // Legacy format: { apiKey: string, model?: string }
  if ('apiKey' in obj && typeof obj.apiKey === 'string' && obj.apiKey.length > 0) {
    const legacy = obj as unknown as LegacyAIConfig;
    return {
      activeProvider: 'openai',
      providers: {
        openai: {
          apiKey: legacy.apiKey,
          model: legacy.model ?? 'gpt-5-mini',
        },
      },
    };
  }

  return null;
}
```

**Step 2: Commit**

```bash
git add src/lib/ai/index.ts
git commit -m "feat(ai): create main entry point with provider registration

Registers OpenAI and Gemini providers. Exports generateSuggestions
that delegates to active provider, fetchProviderModels, and
migrateAIConfig for legacy format migration."
```

---

## Task 7: Add Migration Tests

**Files:**
- Create: `src/__tests__/lib/ai/migration.test.ts`

**Step 1: Write migration tests**

```typescript
import { migrateAIConfig } from '@/lib/ai';

describe('migrateAIConfig', () => {
  it('returns null for null/undefined input', () => {
    expect(migrateAIConfig(null)).toBeNull();
    expect(migrateAIConfig(undefined)).toBeNull();
  });

  it('returns null for non-object input', () => {
    expect(migrateAIConfig('string')).toBeNull();
    expect(migrateAIConfig(42)).toBeNull();
  });

  it('passes through new format unchanged', () => {
    const newFormat = {
      activeProvider: 'openai',
      providers: {
        openai: { apiKey: 'sk-123', model: 'gpt-5-mini' },
      },
    };
    expect(migrateAIConfig(newFormat)).toEqual(newFormat);
  });

  it('migrates legacy format to new format', () => {
    const legacy = { apiKey: 'sk-old-key', model: 'gpt-4o' };
    const result = migrateAIConfig(legacy);

    expect(result).toEqual({
      activeProvider: 'openai',
      providers: {
        openai: { apiKey: 'sk-old-key', model: 'gpt-4o' },
      },
    });
  });

  it('migrates legacy format without model using default', () => {
    const legacy = { apiKey: 'sk-old-key' };
    const result = migrateAIConfig(legacy);

    expect(result).toEqual({
      activeProvider: 'openai',
      providers: {
        openai: { apiKey: 'sk-old-key', model: 'gpt-5-mini' },
      },
    });
  });

  it('returns null for legacy format with empty apiKey', () => {
    expect(migrateAIConfig({ apiKey: '' })).toBeNull();
  });

  it('returns null for object without apiKey or activeProvider', () => {
    expect(migrateAIConfig({ foo: 'bar' })).toBeNull();
  });
});
```

**Step 2: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/lib/ai/migration.test.ts`
Expected: All tests PASS.

**Step 3: Commit**

```bash
git add src/__tests__/lib/ai/migration.test.ts
git commit -m "test(ai): add migration tests for legacy AIConfig format"
```

---

## Task 8: Update AIProvider Context

**Files:**
- Modify: `src/providers/AIProvider.tsx`
- Modify: `src/hooks/useAIConfig.ts`

**Step 1: Rewrite AIProvider to support multi-provider config**

Replace `src/providers/AIProvider.tsx`:

```typescript
'use client';

import {
  createContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { AIConfig, ProviderConfig } from '@/types/ai';
import { getStorageItem, setStorageItem, removeStorageItem, STORAGE_KEYS } from '@/lib/storage';
import { migrateAIConfig } from '@/lib/ai';

// =============================================================================
// Context
// =============================================================================

export interface AIContextValue {
  aiConfig: AIConfig | null;
  isAIEnabled: boolean;
  setProviderConfig: (providerId: string, config: ProviderConfig) => void;
  setActiveProvider: (providerId: string) => void;
  clearProviderConfig: (providerId: string) => void;
}

export const AIContext = createContext<AIContextValue | null>(null);

// =============================================================================
// Provider Component
// =============================================================================

interface AIProviderProps {
  children: ReactNode;
}

export function AIProvider({ children }: AIProviderProps) {
  const [aiConfig, setAIConfigState] = useState<AIConfig | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load and migrate config from localStorage on mount
  useEffect(() => {
    const stored = getStorageItem<unknown>(STORAGE_KEYS.AI_CONFIG);
    const migrated = migrateAIConfig(stored);
    if (migrated) {
      setAIConfigState(migrated);
      // Persist migrated format back to storage
      setStorageItem(STORAGE_KEYS.AI_CONFIG, migrated);
    }
    setIsHydrated(true);
  }, []);

  const persist = useCallback((config: AIConfig) => {
    setAIConfigState(config);
    setStorageItem(STORAGE_KEYS.AI_CONFIG, config);
  }, []);

  const setProviderConfig = useCallback(
    (providerId: string, config: ProviderConfig) => {
      const current = aiConfig ?? { activeProvider: providerId, providers: {} };
      const updated: AIConfig = {
        ...current,
        activeProvider: providerId,
        providers: {
          ...current.providers,
          [providerId]: config,
        },
      };
      persist(updated);
    },
    [aiConfig, persist]
  );

  const setActiveProvider = useCallback(
    (providerId: string) => {
      if (!aiConfig) return;
      persist({ ...aiConfig, activeProvider: providerId });
    },
    [aiConfig, persist]
  );

  const clearProviderConfig = useCallback(
    (providerId: string) => {
      if (!aiConfig) return;
      const { [providerId]: _, ...remaining } = aiConfig.providers;
      const hasRemaining = Object.keys(remaining).length > 0;

      if (!hasRemaining) {
        setAIConfigState(null);
        removeStorageItem(STORAGE_KEYS.AI_CONFIG);
        return;
      }

      const newActive =
        aiConfig.activeProvider === providerId
          ? Object.keys(remaining)[0]
          : aiConfig.activeProvider;

      persist({
        activeProvider: newActive,
        providers: remaining,
      });
    },
    [aiConfig, persist]
  );

  const activeProviderConfig = aiConfig?.providers[aiConfig.activeProvider];
  const isAIEnabled =
    isHydrated &&
    aiConfig !== null &&
    !!activeProviderConfig?.apiKey &&
    activeProviderConfig.apiKey.length > 0;

  return (
    <AIContext.Provider
      value={{
        aiConfig,
        isAIEnabled,
        setProviderConfig,
        setActiveProvider,
        clearProviderConfig,
      }}
    >
      {children}
    </AIContext.Provider>
  );
}
```

**Step 2: Update `src/hooks/useAIConfig.ts`**

The hook itself doesn't change — it just returns `AIContextValue`. But the type it returns has changed. Verify it still works:

```typescript
'use client';

import { useContext } from 'react';
import { AIContext, type AIContextValue } from '@/providers/AIProvider';

export function useAIConfig(): AIContextValue {
  const context = useContext(AIContext);

  if (!context) {
    throw new Error(
      'useAIConfig must be used within an <AIProvider>. ' +
        'Wrap your component tree with <AIProvider> in layout.tsx.'
    );
  }

  return context;
}
```

**Step 3: Commit**

```bash
git add src/providers/AIProvider.tsx src/hooks/useAIConfig.ts
git commit -m "feat(ai): update AIProvider for multi-provider config

Support per-provider API keys, active provider switching,
and automatic migration from legacy single-provider format."
```

---

## Task 9: Update useAISuggestions Hook

**Files:**
- Modify: `src/hooks/useAISuggestions.ts`

**Step 1: Update the hook to use the new generateSuggestions API**

The only change is the import path and that `generateSuggestions` now takes `AIConfig` (new shape) instead of the old shape. The function signature in `lib/ai/index.ts` already accepts `AIConfig`:

```typescript
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { AISuggestion } from '@/types/ai';
import { useAIConfig } from '@/hooks/useAIConfig';
import { useActiveSection } from '@/hooks/useActiveSection';
import { generateSuggestions, AIError } from '@/lib/ai';

export interface UseAISuggestionsReturn {
  suggestions: AISuggestion[];
  isLoading: boolean;
  error: string | null;
  fetchSuggestions: () => void;
  clearSuggestions: () => void;
}

export function useAISuggestions(): UseAISuggestionsReturn {
  const { aiConfig } = useAIConfig();
  const { activeSectionId, activeSectionType, activeSectionContent } =
    useActiveSection();

  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prevSectionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (prevSectionIdRef.current !== activeSectionId) {
      prevSectionIdRef.current = activeSectionId;
      setSuggestions([]);
      setError(null);
    }
  }, [activeSectionId]);

  const fetchSuggestions = useCallback(async () => {
    if (!aiConfig || !activeSectionId || !activeSectionType) {
      setError('Select a section to get AI suggestions.');
      return;
    }

    const content = activeSectionContent.trim();
    if (!content) {
      setError('Start typing in a section to get AI suggestions.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      const results = await generateSuggestions(
        aiConfig,
        activeSectionType,
        content
      );

      const withSectionId = results.map((s) => ({
        ...s,
        sectionId: activeSectionId,
      }));

      setSuggestions(withSectionId);
    } catch (err) {
      if (err instanceof AIError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [aiConfig, activeSectionId, activeSectionType, activeSectionContent]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    fetchSuggestions,
    clearSuggestions,
  };
}
```

**Step 2: Commit**

```bash
git add src/hooks/useAISuggestions.ts
git commit -m "refactor(ai): update useAISuggestions to use new AI entry point

Import generateSuggestions from lib/ai instead of the old lib/ai.ts.
No behavioral changes — the hook is provider-agnostic."
```

---

## Task 10: Update AI Settings Modal

**Files:**
- Modify: `src/components/ai/AISettingsModal.tsx`

**Step 1: Rewrite the settings modal with provider selector and model refresh**

```typescript
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Eye, EyeOff, CheckCircle, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { useAIConfig } from '@/hooks/useAIConfig';
import { useToast } from '@/hooks/useToast';
import { getAllProviders, fetchProviderModels } from '@/lib/ai';
import type { AIModel } from '@/types/ai';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AISettingsModal({ isOpen, onClose }: AISettingsModalProps) {
  const { aiConfig, isAIEnabled, setProviderConfig, clearProviderConfig } = useAIConfig();
  const { addToast } = useToast();

  const providers = getAllProviders();
  const defaultProviderId = providers[0]?.id ?? 'openai';

  const [selectedProviderId, setSelectedProviderId] = useState(defaultProviderId);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [models, setModels] = useState<AIModel[]>([]);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isFetchingModels, setIsFetchingModels] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const selectedProvider = providers.find((p) => p.id === selectedProviderId);

  // Sync form state when modal opens or provider changes
  const syncFormState = useCallback(
    (providerId: string) => {
      const providerDef = providers.find((p) => p.id === providerId);
      const providerCfg = aiConfig?.providers[providerId];

      setApiKey(providerCfg?.apiKey ?? '');
      setModel(providerCfg?.model ?? providerDef?.defaultModel ?? '');
      setModels(providerCfg?.cachedModels ?? []);
      setShowKey(false);
      setSaved(false);
    },
    [aiConfig, providers]
  );

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
      const activeId = aiConfig?.activeProvider ?? defaultProviderId;
      setSelectedProviderId(activeId);
      syncFormState(activeId);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, aiConfig, defaultProviderId, syncFormState]);

  // Return focus on close
  useEffect(() => {
    if (!isOpen && triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;
    const dialog = dialogRef.current;

    function handleTab(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const focusableElements = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstEl = focusableElements[0];
      const lastEl = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl?.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl?.focus();
        }
      }
    }

    dialog.addEventListener('keydown', handleTab);
    return () => dialog.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  if (!isOpen) return null;

  function handleProviderChange(providerId: string) {
    setSelectedProviderId(providerId);
    syncFormState(providerId);
  }

  async function handleFetchModels() {
    const trimmedKey = apiKey.trim();
    if (!trimmedKey || !selectedProviderId) return;

    setIsFetchingModels(true);
    try {
      const fetched = await fetchProviderModels(selectedProviderId, trimmedKey);
      setModels(fetched);
      if (fetched.length > 0 && !fetched.find((m) => m.id === model)) {
        setModel(fetched[0].id);
      }
      addToast(`Loaded ${fetched.length} models`, 'success');
    } catch {
      addToast('Failed to fetch models. Check your API key.', 'error');
    } finally {
      setIsFetchingModels(false);
    }
  }

  function handleSave() {
    const trimmedKey = apiKey.trim();
    if (!trimmedKey) return;

    setProviderConfig(selectedProviderId, {
      apiKey: trimmedKey,
      model,
      cachedModels: models.length > 0 ? models : undefined,
    });
    setSaved(true);
    addToast('Settings saved', 'success');

    // Fetch models in the background on first save if no cached models
    if (models.length === 0) {
      fetchProviderModels(selectedProviderId, trimmedKey)
        .then((fetched) => {
          if (fetched.length > 0) {
            setProviderConfig(selectedProviderId, {
              apiKey: trimmedKey,
              model,
              cachedModels: fetched,
            });
          }
        })
        .catch(() => {
          // Silent fail for background fetch
        });
    }

    setTimeout(() => onClose(), 600);
  }

  function handleRemove() {
    clearProviderConfig(selectedProviderId);
    setApiKey('');
    setModel(selectedProvider?.defaultModel ?? '');
    setModels([]);
    setSaved(false);
    addToast('API key removed', 'info');
    onClose();
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  const canSave = apiKey.trim().length > 0;
  const hasKeyForProvider = !!aiConfig?.providers[selectedProviderId]?.apiKey;
  const isActiveProvider = aiConfig?.activeProvider === selectedProviderId;

  // Build model options: cached models or just the default
  const modelOptions =
    models.length > 0
      ? models
      : selectedProvider
        ? [{ id: selectedProvider.defaultModel, name: selectedProvider.defaultModel }]
        : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="AI Settings"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in" />

      {/* Modal */}
      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 fade-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-surface-900">
              AI Settings
            </h2>
            <p className="mt-0.5 text-sm text-surface-500">
              Configure your AI provider for suggestions
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600"
            aria-label="Close settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Status indicator */}
          <div
            className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
              isAIEnabled
                ? 'bg-green-50 text-green-700 border border-green-100'
                : 'bg-surface-50 text-surface-600 border border-surface-100'
            }`}
          >
            {isAIEnabled ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                AI suggestions enabled
                {aiConfig && (
                  <span className="ml-auto text-xs text-green-600">
                    {providers.find((p) => p.id === aiConfig.activeProvider)?.name}
                  </span>
                )}
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-surface-400" />
                No API key configured
              </>
            )}
          </div>

          {/* Provider Selector */}
          <div>
            <label
              htmlFor="ai-provider"
              className="mb-1.5 block text-sm font-medium text-surface-700"
            >
              Provider
            </label>
            <select
              id="ai-provider"
              value={selectedProviderId}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2.5 text-sm text-surface-900 transition-all duration-150 hover:border-surface-300 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* API Key Input */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="api-key"
                className="block text-sm font-medium text-surface-700"
              >
                API Key
              </label>
              {selectedProvider && (
                <a
                  href={selectedProvider.apiKeyHelpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
                >
                  Get API key
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <div className="relative">
              <input
                ref={inputRef}
                id="api-key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setSaved(false);
                }}
                placeholder={selectedProvider?.apiKeyPlaceholder ?? ''}
                className="w-full rounded-lg border border-surface-200 bg-white py-2.5 pl-3 pr-10 text-sm text-surface-900 placeholder:text-surface-400 transition-all duration-150 hover:border-surface-300 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:shadow-sm"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-surface-400 transition-colors hover:text-surface-600"
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-surface-400">
              Your key is stored locally in your browser. It is only used for
              direct API calls to {selectedProvider?.name ?? 'the AI provider'}.
            </p>
          </div>

          {/* Model Selector */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="model"
                className="block text-sm font-medium text-surface-700"
              >
                Model
              </label>
              <button
                type="button"
                onClick={handleFetchModels}
                disabled={!apiKey.trim() || isFetchingModels}
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 disabled:text-surface-400 disabled:cursor-not-allowed"
                aria-label="Refresh model list"
              >
                <RefreshCw
                  className={`h-3 w-3 ${isFetchingModels ? 'animate-spin' : ''}`}
                />
                {isFetchingModels ? 'Loading...' : 'Refresh models'}
              </button>
            </div>
            <select
              id="model"
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                setSaved(false);
              }}
              className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2.5 text-sm text-surface-900 transition-all duration-150 hover:border-surface-300 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              {modelOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-surface-100 px-6 py-4">
          {hasKeyForProvider ? (
            <button
              type="button"
              onClick={handleRemove}
              className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              Remove Key
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave || saved}
              className={`rounded-lg px-5 py-2 text-sm font-medium transition-all duration-150 ${
                saved
                  ? 'bg-green-600 text-white'
                  : canSave
                    ? 'bg-primary-600 text-white shadow-sm hover:bg-primary-700 hover:shadow-md active:bg-primary-800'
                    : 'cursor-not-allowed bg-surface-100 text-surface-400'
              }`}
            >
              {saved ? 'Saved!' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/ai/AISettingsModal.tsx
git commit -m "feat(ai): update settings modal for multi-provider support

Add provider selector dropdown, dynamic API key placeholder/help link,
model refresh button that fetches from provider API, and per-provider
key management. Background model fetch on first save."
```

---

## Task 11: Delete Old AI Module and Update Remaining Imports

**Files:**
- Delete: `src/lib/ai.ts`
- Delete: `src/__tests__/lib/ai.test.ts`
- Modify: any remaining files that import from `@/lib/ai` (should now resolve to `@/lib/ai/index.ts`)

**Step 1: Delete the old files**

```bash
rm src/lib/ai.ts
rm src/__tests__/lib/ai.test.ts
```

**Step 2: Verify imports resolve correctly**

The barrel export at `src/lib/ai/index.ts` exports `generateSuggestions`, `AIError`, and `stripHtml` — the same symbols the old module exported. TypeScript path resolution treats `@/lib/ai` as either a file (`ai.ts`) or a directory with `index.ts`. Since we deleted `ai.ts`, all imports from `@/lib/ai` will resolve to `@/lib/ai/index.ts`.

Run: `npx tsc --noEmit`
Expected: No errors (or only unrelated pre-existing ones).

**Step 3: Run all tests**

Run: `pnpm test`
Expected: All tests pass. The old test file is deleted, replaced by `utils.test.ts`, `openai.test.ts`, `gemini.test.ts`, and `migration.test.ts`.

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor(ai): remove old monolithic ai.ts, complete migration

Delete src/lib/ai.ts and its tests. All functionality is now in
src/lib/ai/ directory with provider-based architecture. All imports
resolve to the new barrel export at lib/ai/index.ts."
```

---

## Task 12: Build Verification and Final Cleanup

**Files:**
- None (verification only)

**Step 1: Run the full test suite**

Run: `pnpm test`
Expected: All tests pass.

**Step 2: Run TypeScript type checking**

Run: `npx tsc --noEmit`
Expected: No type errors.

**Step 3: Run the linter**

Run: `pnpm lint`
Expected: No lint errors (or only pre-existing ones).

**Step 4: Run the dev server and verify manually**

Run: `pnpm dev`

Manual checks:
1. Navigate to `/builder`
2. Open AI Settings modal — verify provider dropdown shows "OpenAI" and "Google Gemini"
3. Switch between providers — verify placeholder text and help link change
4. Enter an API key and save — verify "Saved!" confirmation
5. If you have a real key: click "Refresh models" and verify the dropdown populates
6. Verify the AI panel appears when a key is configured
7. Clear the key — verify AI panel hides

**Step 5: Run the production build**

Run: `pnpm build`
Expected: Builds successfully. Verify the landing page bundle does NOT include AI provider code (route-level code splitting).

**Step 6: Commit any final fixes if needed**

```bash
git add -A
git commit -m "chore: final cleanup after multi-provider AI migration"
```

---

## Summary of New/Modified Files

| Action | File |
|--------|------|
| Modify | `src/types/ai.ts` |
| Create | `src/lib/ai/index.ts` |
| Create | `src/lib/ai/registry.ts` |
| Create | `src/lib/ai/utils.ts` |
| Create | `src/lib/ai/prompts.ts` |
| Create | `src/lib/ai/providers/openai.ts` |
| Create | `src/lib/ai/providers/gemini.ts` |
| Modify | `src/providers/AIProvider.tsx` |
| Modify | `src/hooks/useAIConfig.ts` |
| Modify | `src/hooks/useAISuggestions.ts` |
| Modify | `src/components/ai/AISettingsModal.tsx` |
| Delete | `src/lib/ai.ts` |
| Delete | `src/__tests__/lib/ai.test.ts` |
| Create | `src/__tests__/lib/ai/utils.test.ts` |
| Create | `src/__tests__/lib/ai/providers/openai.test.ts` |
| Create | `src/__tests__/lib/ai/providers/gemini.test.ts` |
| Create | `src/__tests__/lib/ai/migration.test.ts` |
