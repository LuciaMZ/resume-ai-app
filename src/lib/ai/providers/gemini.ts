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
