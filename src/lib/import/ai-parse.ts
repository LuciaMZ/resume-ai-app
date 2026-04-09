// =============================================================================
// AI-Powered Resume Parsing
// =============================================================================
// Sends extracted PDF text to the user's configured AI provider (OpenAI or
// Gemini) with a structured prompt that describes the ResumeData schema.
// Returns parsed ResumeData JSON.
//
// Follows the fetch patterns established in:
//   - src/lib/ai/providers/openai.ts
//   - src/lib/ai/providers/gemini.ts
// =============================================================================

import type { ResumeData } from '@/types/resume';
import { AIParsingError } from './errors';

/**
 * Parse extracted resume text into structured ResumeData using AI.
 *
 * Supports OpenAI and Gemini providers via direct fetch (no backend).
 * Includes a single retry on JSON parse failure with error context.
 */
export async function parseResumeWithAI(
  text: string,
  apiKey: string,
  model: string,
  provider: string,
  signal?: AbortSignal
): Promise<ResumeData> {
  if (!apiKey) {
    throw new AIParsingError(
      'No AI API key configured. Please set up your API key in Settings.',
      'no_ai_configured'
    );
  }

  const systemPrompt = buildResumeParsingPrompt();

  // First attempt
  let rawResponse = await callAIProvider(provider, apiKey, model, systemPrompt, text, signal);
  let parsed = tryParseResumeJSON(rawResponse);

  // Single retry on parse failure — include the error in context
  if (!parsed) {
    const retryUserMessage =
      `The previous response was not valid JSON. Here is the error:\n\n` +
      `Parse failed for response starting with: "${rawResponse.substring(0, 200)}..."\n\n` +
      `Please try again. Return ONLY a valid JSON object matching the ResumeData schema. ` +
      `No markdown, no explanation, no code fences — just the raw JSON object.\n\n` +
      `Original resume text:\n${text}`;

    rawResponse = await callAIProvider(provider, apiKey, model, systemPrompt, retryUserMessage, signal);
    parsed = tryParseResumeJSON(rawResponse);

    if (!parsed) {
      throw new AIParsingError(
        'AI returned an invalid response that could not be parsed as JSON after retry. ' +
        'Try again or use a different AI model.',
        'invalid_response'
      );
    }
  }

  return parsed;
}

// =============================================================================
// AI Provider Calls
// =============================================================================

/**
 * Route the request to the correct AI provider.
 * Follows the same fetch patterns as the existing provider implementations.
 */
async function callAIProvider(
  provider: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  userMessage: string,
  signal?: AbortSignal
): Promise<string> {
  switch (provider) {
    case 'openai':
      return callOpenAI(apiKey, model, systemPrompt, userMessage, signal);
    case 'gemini':
      return callGemini(apiKey, model, systemPrompt, userMessage, signal);
    default:
      throw new AIParsingError(
        `Unsupported AI provider: "${provider}". Supported providers: openai, gemini.`,
        'no_ai_configured'
      );
  }
}

/** Call OpenAI chat completions — mirrors src/lib/ai/providers/openai.ts */
async function callOpenAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userMessage: string,
  signal?: AbortSignal
): Promise<string> {
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
          { role: 'user', content: userMessage },
        ],
        max_completion_tokens: 8192,
        response_format: { type: 'json_object' },
      }),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error; // Let abort errors propagate
    }
    throw new AIParsingError(
      'Could not connect to OpenAI. Check your internet connection.',
      'ai_request_failed'
    );
  }

  if (!response.ok) {
    handleHTTPError(response.status, 'OpenAI');
  }

  return extractOpenAIContent(response);
}

/** Call Gemini generateContent — mirrors src/lib/ai/providers/gemini.ts */
async function callGemini(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userMessage: string,
  signal?: AbortSignal
): Promise<string> {
  const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

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
              parts: [{ text: userMessage }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
          },
        }),
        signal,
      }
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new AIParsingError(
      'Could not connect to Google Gemini. Check your internet connection.',
      'ai_request_failed'
    );
  }

  if (!response.ok) {
    handleHTTPError(response.status, 'Gemini');
  }

  return extractGeminiContent(response);
}

// =============================================================================
// Response Extraction
// =============================================================================

/**
 * Extract message content from OpenAI response.
 * Handles both legacy choices format and newer output_text format.
 * Mirrors extractMessageContent() in src/lib/ai/providers/openai.ts.
 */
async function extractOpenAIContent(response: Response): Promise<string> {
  let data: Record<string, unknown>;
  try {
    data = await response.json();
  } catch {
    throw new AIParsingError('Failed to parse OpenAI response.', 'ai_request_failed');
  }

  // Try output_text (newer format)
  if (typeof data.output_text === 'string') return data.output_text;

  // Try choices format (legacy / standard)
  if (Array.isArray(data.choices)) {
    const choices = data.choices as { message?: { content?: string } }[];
    const content = choices[0]?.message?.content;
    if (content) return content;
  }

  // Try output array format (newer)
  if (Array.isArray(data.output)) {
    const output = data.output as { content?: { text?: string }[] | string }[];
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

  throw new AIParsingError('Unexpected OpenAI response format.', 'invalid_response');
}

/**
 * Extract content from Gemini response.
 * Mirrors the extraction in src/lib/ai/providers/gemini.ts.
 */
async function extractGeminiContent(response: Response): Promise<string> {
  let data: Record<string, unknown>;
  try {
    data = await response.json();
  } catch {
    throw new AIParsingError('Failed to parse Gemini response.', 'ai_request_failed');
  }

  const candidates = data.candidates as
    | { content?: { parts?: { text?: string }[] } }[]
    | undefined;

  const text = candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new AIParsingError('Unexpected Gemini response format.', 'invalid_response');
  }

  return text;
}

// =============================================================================
// Helpers
// =============================================================================

/** Handle HTTP error codes consistently across providers */
function handleHTTPError(status: number, providerName: string): never {
  if (status === 401 || status === 403) {
    throw new AIParsingError(
      `Invalid ${providerName} API key. Please check your key in Settings.`,
      'ai_request_failed'
    );
  }
  if (status === 429) {
    throw new AIParsingError(
      `${providerName} rate limit exceeded. Please wait a moment and try again.`,
      'ai_rate_limit'
    );
  }
  throw new AIParsingError(
    `${providerName} API error (HTTP ${status}). Please try again.`,
    'ai_request_failed'
  );
}

/**
 * Try to parse a raw string as ResumeData JSON.
 * Strips markdown code fences before parsing (matches pattern in src/lib/ai/utils.ts).
 * Returns null on failure instead of throwing.
 */
function tryParseResumeJSON(raw: string): ResumeData | null {
  try {
    const cleaned = raw
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    const parsed = JSON.parse(cleaned);

    // Basic shape check — must be an object with expected top-level keys
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      return parsed as ResumeData;
    }
    return null;
  } catch {
    return null;
  }
}

// =============================================================================
// Prompt
// =============================================================================

/**
 * Build the system prompt that instructs the AI to parse resume text
 * into the ResumeData schema. Includes field names, types, and an example.
 */
function buildResumeParsingPrompt(): string {
  return `You are a resume parser. Your job is to extract structured data from raw resume text and return it as a JSON object matching the exact schema below.

IMPORTANT RULES:
- Return ONLY a valid JSON object. No markdown, no explanation, no code fences.
- Extract ALL information from the resume — do not skip or summarize.
- If information for a field is not found in the text, use empty string "" for required string fields.
- For dates, use "YYYY-MM" format (e.g., "2023-06"). If only a year is given, use "YYYY-01". If a date says "Present" or "Current", set endDate to null.
- For description/content fields, format as simple HTML. ALWAYS use <ul><li> for bullet points — NEVER use plain text dashes (-) or asterisks (*). Every job responsibility, achievement, or list item MUST be wrapped in <ul><li>...</li></ul>. Use <p> tags only for flowing paragraph text. You may also use <strong>, <em> tags for emphasis.
- Wrap plain text paragraphs in <p> tags.
- Categorize sections correctly: professional summary goes in a "summary" section, work history in "experience", education in "education", skills in "skills". Anything else (certifications, projects, volunteer work, publications, languages, awards, etc.) should be "custom" sections.
- For skills, put ALL skills into a SINGLE category named "Tools". Do NOT split skills into multiple categories. Combine all programming languages, frameworks, tools, technologies, soft skills, etc. into one flat list under "Tools".

SCHEMA (TypeScript interfaces for reference):

interface ResumeData {
  meta: {
    id: string;           // Generate any UUID-like string, will be replaced
    templateId: string;   // Use "classic"
    createdAt: string;    // Use current ISO timestamp
    updatedAt: string;    // Use current ISO timestamp
    schemaVersion: number; // Use 1
  };
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: string;     // "City, State" or "City, Country"
    website?: string;     // Optional
    linkedIn?: string;    // Optional — LinkedIn URL
    github?: string;      // Optional — GitHub URL
  };
  sections: ResumeSection[];
}

interface ResumeSection {
  id: string;             // Generate any UUID-like string, will be replaced
  type: "summary" | "experience" | "education" | "skills" | "custom";
  title: string;          // Display title, e.g., "Professional Summary", "Work Experience"
  visible: true;
  order: number;          // 0-based index
  entries: SectionEntry[];
}

// Entry type depends on section type:

// For type "summary":
{ id: string; type: "summary"; content: string; }
// content is HTML string of the professional summary

// For type "experience":
{ id: string; type: "experience"; jobTitle: string; company: string; location?: string; startDate: string; endDate: string | null; description: string; }
// description is HTML with bullet points of responsibilities/achievements

// For type "education":
{ id: string; type: "education"; institution: string; degree: string; field?: string; startDate: string; endDate: string | null; description?: string; }

// For type "skills":
{ id: string; type: "skills"; categories: Array<{ id: string; name: string; skills: string[]; }>; }

// For type "custom":
{ id: string; type: "custom"; title?: string; subtitle?: string; startDate?: string; endDate?: string | null; description: string; }

EXAMPLE OUTPUT STRUCTURE:
{
  "meta": {
    "id": "temp-id",
    "templateId": "classic",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "schemaVersion": 1
  },
  "personalInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "(555) 123-4567",
    "location": "San Francisco, CA",
    "website": "https://johndoe.dev",
    "linkedIn": "https://linkedin.com/in/johndoe",
    "github": "https://github.com/johndoe"
  },
  "sections": [
    {
      "id": "sec-1",
      "type": "summary",
      "title": "Professional Summary",
      "visible": true,
      "order": 0,
      "entries": [
        {
          "id": "entry-1",
          "type": "summary",
          "content": "<p>Experienced software engineer with 8+ years of expertise in full-stack development...</p>"
        }
      ]
    },
    {
      "id": "sec-2",
      "type": "experience",
      "title": "Work Experience",
      "visible": true,
      "order": 1,
      "entries": [
        {
          "id": "entry-2",
          "type": "experience",
          "jobTitle": "Senior Software Engineer",
          "company": "Tech Corp",
          "location": "San Francisco, CA",
          "startDate": "2020-03",
          "endDate": null,
          "description": "<ul><li>Led a team of 5 engineers to deliver microservices architecture</li><li>Reduced deployment time by 60% through CI/CD improvements</li><li>Implemented automated testing pipeline increasing code coverage to 95%</li></ul>"
        }
      ]
    },
    {
      "id": "sec-3",
      "type": "education",
      "title": "Education",
      "visible": true,
      "order": 2,
      "entries": [
        {
          "id": "entry-3",
          "type": "education",
          "institution": "University of California, Berkeley",
          "degree": "Bachelor of Science",
          "field": "Computer Science",
          "startDate": "2012-08",
          "endDate": "2016-05"
        }
      ]
    },
    {
      "id": "sec-4",
      "type": "skills",
      "title": "Skills",
      "visible": true,
      "order": 3,
      "entries": [
        {
          "id": "entry-4",
          "type": "skills",
          "categories": [
            { "id": "cat-1", "name": "Tools", "skills": ["TypeScript", "Python", "Go", "React", "Node.js", "Django", "Docker", "AWS"] }
          ]
        }
      ]
    },
    {
      "id": "sec-5",
      "type": "custom",
      "title": "Certifications",
      "visible": true,
      "order": 4,
      "entries": [
        {
          "id": "entry-5",
          "type": "custom",
          "title": "AWS Solutions Architect",
          "subtitle": "Amazon Web Services",
          "startDate": "2022-06",
          "endDate": null,
          "description": "<p>Professional-level certification for designing distributed systems on AWS.</p>"
        }
      ]
    }
  ]
}

Parse the following resume text and return the structured JSON:`;
}
