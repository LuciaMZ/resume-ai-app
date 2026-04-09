// =============================================================================
// Tests: AI-Powered Resume Parsing (src/lib/import/ai-parse.ts)
// =============================================================================

import { AIParsingError } from '@/lib/import/errors';
import { parseResumeWithAI } from '@/lib/import/ai-parse';

// =============================================================================
// Mock fetch globally
// =============================================================================

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// =============================================================================
// Helpers
// =============================================================================

/** Minimal valid ResumeData-like JSON the AI would return */
function makeValidResumeJSON() {
  return {
    meta: {
      id: 'temp-id',
      templateId: 'classic',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      schemaVersion: 1,
    },
    personalInfo: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '555-1234',
      location: 'San Francisco, CA',
    },
    sections: [],
  };
}

/** Create an OpenAI-style response with choices format */
function openAIChoicesResponse(content: string) {
  return {
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue({
      choices: [{ message: { content } }],
    }),
  };
}

/** Create an OpenAI-style response with output_text format */
function openAIOutputTextResponse(content: string) {
  return {
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue({
      output_text: content,
    }),
  };
}

/** Create a Gemini-style response */
function geminiResponse(content: string) {
  return {
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue({
      candidates: [{ content: { parts: [{ text: content }] } }],
    }),
  };
}

const SAMPLE_TEXT = 'John Doe, Software Engineer at TechCorp...';

// =============================================================================
// Tests
// =============================================================================

describe('parseResumeWithAI', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  // --- No API key ---

  it('throws AIParsingError when no API key is provided', async () => {
    try {
      await parseResumeWithAI(SAMPLE_TEXT, '', 'gpt-4', 'openai');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AIParsingError);
      expect((err as AIParsingError).code).toBe('no_ai_configured');
    }
  });

  // --- OpenAI API call shape ---

  it('calls OpenAI chat completions endpoint with correct URL, headers, and body', async () => {
    const validJSON = JSON.stringify(makeValidResumeJSON());
    mockFetch.mockResolvedValue(openAIChoicesResponse(validJSON));

    await parseResumeWithAI(SAMPLE_TEXT, 'sk-test-key', 'gpt-4', 'openai');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];

    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(options.headers.Authorization).toBe('Bearer sk-test-key');

    const body = JSON.parse(options.body);
    expect(body.model).toBe('gpt-4');
    expect(body.messages).toHaveLength(2);
    expect(body.messages[0].role).toBe('system');
    expect(body.messages[1].role).toBe('user');
    expect(body.messages[1].content).toContain(SAMPLE_TEXT);
    expect(body.max_completion_tokens).toBe(8192);
    expect(body.response_format).toEqual({ type: 'json_object' });
  });

  // --- Gemini API call shape ---

  it('calls Gemini generateContent endpoint with correct URL and body', async () => {
    const validJSON = JSON.stringify(makeValidResumeJSON());
    mockFetch.mockResolvedValue(geminiResponse(validJSON));

    await parseResumeWithAI(SAMPLE_TEXT, 'gemini-key', 'gemini-pro', 'gemini');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];

    expect(url).toContain('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent');
    expect(url).toContain('key=gemini-key');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');

    const body = JSON.parse(options.body);
    expect(body.system_instruction.parts[0].text).toBeTruthy();
    expect(body.contents[0].role).toBe('user');
    expect(body.contents[0].parts[0].text).toContain(SAMPLE_TEXT);
    expect(body.generationConfig.maxOutputTokens).toBe(8192);
    expect(body.generationConfig.responseMimeType).toBe('application/json');
  });

  // --- Successful JSON parsing ---

  it('parses valid JSON from OpenAI choices response', async () => {
    const resume = makeValidResumeJSON();
    mockFetch.mockResolvedValue(openAIChoicesResponse(JSON.stringify(resume)));

    const result = await parseResumeWithAI(SAMPLE_TEXT, 'sk-key', 'gpt-4', 'openai');

    expect(result.personalInfo.firstName).toBe('John');
    expect(result.personalInfo.lastName).toBe('Doe');
  });

  it('parses valid JSON from OpenAI output_text response', async () => {
    const resume = makeValidResumeJSON();
    mockFetch.mockResolvedValue(openAIOutputTextResponse(JSON.stringify(resume)));

    const result = await parseResumeWithAI(SAMPLE_TEXT, 'sk-key', 'gpt-4', 'openai');

    expect(result.personalInfo.firstName).toBe('John');
  });

  it('parses valid JSON from OpenAI output array format', async () => {
    const resume = makeValidResumeJSON();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        output: [{ content: [{ text: JSON.stringify(resume) }] }],
      }),
    });

    const result = await parseResumeWithAI(SAMPLE_TEXT, 'sk-key', 'gpt-4', 'openai');
    expect(result.personalInfo.firstName).toBe('John');
  });

  it('parses valid JSON from Gemini response', async () => {
    const resume = makeValidResumeJSON();
    mockFetch.mockResolvedValue(geminiResponse(JSON.stringify(resume)));

    const result = await parseResumeWithAI(SAMPLE_TEXT, 'gemini-key', 'gemini-pro', 'gemini');

    expect(result.personalInfo.firstName).toBe('John');
  });

  // --- Markdown code fence stripping ---

  it('strips markdown code fences before parsing JSON', async () => {
    const resume = makeValidResumeJSON();
    const fencedJSON = '```json\n' + JSON.stringify(resume) + '\n```';
    mockFetch.mockResolvedValue(openAIChoicesResponse(fencedJSON));

    const result = await parseResumeWithAI(SAMPLE_TEXT, 'sk-key', 'gpt-4', 'openai');

    expect(result.personalInfo.firstName).toBe('John');
  });

  it('strips code fences without language tag', async () => {
    const resume = makeValidResumeJSON();
    const fencedJSON = '```\n' + JSON.stringify(resume) + '\n```';
    mockFetch.mockResolvedValue(openAIChoicesResponse(fencedJSON));

    const result = await parseResumeWithAI(SAMPLE_TEXT, 'sk-key', 'gpt-4', 'openai');

    expect(result.personalInfo.firstName).toBe('John');
  });

  // --- Retry on malformed JSON ---

  it('retries once when first response is malformed JSON', async () => {
    const resume = makeValidResumeJSON();
    const validJSON = JSON.stringify(resume);

    // First call returns malformed JSON, second returns valid
    mockFetch
      .mockResolvedValueOnce(openAIChoicesResponse('Not valid JSON {broken'))
      .mockResolvedValueOnce(openAIChoicesResponse(validJSON));

    const result = await parseResumeWithAI(SAMPLE_TEXT, 'sk-key', 'gpt-4', 'openai');

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result.personalInfo.firstName).toBe('John');

    // Second call should include error context in user message
    const secondBody = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(secondBody.messages[1].content).toContain('not valid JSON');
  });

  it('throws AIParsingError after retry also fails', async () => {
    // Both calls return invalid JSON
    mockFetch
      .mockResolvedValue(openAIChoicesResponse('invalid json'));

    try {
      await parseResumeWithAI(SAMPLE_TEXT, 'sk-key', 'gpt-4', 'openai');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AIParsingError);
      expect((err as AIParsingError).code).toBe('invalid_response');
    }

    // Should have been called twice (initial + retry)
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  // --- AbortSignal cancellation ---

  it('passes AbortSignal to fetch', async () => {
    const resume = makeValidResumeJSON();
    mockFetch.mockResolvedValue(openAIChoicesResponse(JSON.stringify(resume)));

    const controller = new AbortController();
    await parseResumeWithAI(SAMPLE_TEXT, 'sk-key', 'gpt-4', 'openai', controller.signal);

    const [, options] = mockFetch.mock.calls[0];
    expect(options.signal).toBe(controller.signal);
  });

  it('propagates AbortError when fetch is aborted', async () => {
    const abortError = new DOMException('The operation was aborted.', 'AbortError');
    mockFetch.mockRejectedValue(abortError);

    try {
      await parseResumeWithAI(SAMPLE_TEXT, 'sk-key', 'gpt-4', 'openai');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(DOMException);
      expect((err as DOMException).name).toBe('AbortError');
    }
  });

  // --- Error handling ---

  it('throws AIParsingError on network error (OpenAI)', async () => {
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

    try {
      await parseResumeWithAI(SAMPLE_TEXT, 'sk-key', 'gpt-4', 'openai');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AIParsingError);
      expect((err as AIParsingError).code).toBe('ai_request_failed');
      expect((err as AIParsingError).message).toContain('OpenAI');
    }
  });

  it('throws AIParsingError on network error (Gemini)', async () => {
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

    try {
      await parseResumeWithAI(SAMPLE_TEXT, 'gemini-key', 'gemini-pro', 'gemini');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AIParsingError);
      expect((err as AIParsingError).code).toBe('ai_request_failed');
      expect((err as AIParsingError).message).toContain('Gemini');
    }
  });

  it('throws AIParsingError with ai_request_failed on 401 (auth error)', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
    });

    try {
      await parseResumeWithAI(SAMPLE_TEXT, 'bad-key', 'gpt-4', 'openai');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AIParsingError);
      expect((err as AIParsingError).code).toBe('ai_request_failed');
      expect((err as AIParsingError).message).toContain('Invalid');
    }
  });

  it('throws AIParsingError with ai_request_failed on 403 (forbidden)', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
    });

    try {
      await parseResumeWithAI(SAMPLE_TEXT, 'bad-key', 'gpt-4', 'openai');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AIParsingError);
      expect((err as AIParsingError).code).toBe('ai_request_failed');
    }
  });

  it('throws AIParsingError with ai_rate_limit on 429', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
    });

    try {
      await parseResumeWithAI(SAMPLE_TEXT, 'sk-key', 'gpt-4', 'openai');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AIParsingError);
      expect((err as AIParsingError).code).toBe('ai_rate_limit');
    }
  });

  it('throws AIParsingError on generic HTTP error (500)', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    });

    try {
      await parseResumeWithAI(SAMPLE_TEXT, 'sk-key', 'gpt-4', 'openai');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AIParsingError);
      expect((err as AIParsingError).code).toBe('ai_request_failed');
      expect((err as AIParsingError).message).toContain('500');
    }
  });

  // --- Unsupported provider ---

  it('throws AIParsingError for unsupported provider', async () => {
    try {
      await parseResumeWithAI(SAMPLE_TEXT, 'key', 'model', 'claude');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AIParsingError);
      expect((err as AIParsingError).code).toBe('no_ai_configured');
      expect((err as AIParsingError).message).toContain('claude');
    }
  });

  // --- Unexpected response format ---

  it('throws AIParsingError when OpenAI response has no content', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ unexpected: 'format' }),
    });

    try {
      await parseResumeWithAI(SAMPLE_TEXT, 'sk-key', 'gpt-4', 'openai');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AIParsingError);
      expect((err as AIParsingError).code).toBe('invalid_response');
    }
  });

  it('throws AIParsingError when Gemini response has no candidates', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ candidates: [] }),
    });

    try {
      await parseResumeWithAI(SAMPLE_TEXT, 'gemini-key', 'gemini-pro', 'gemini');
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AIParsingError);
      expect((err as AIParsingError).code).toBe('invalid_response');
    }
  });
});
