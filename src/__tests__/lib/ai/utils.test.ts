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
