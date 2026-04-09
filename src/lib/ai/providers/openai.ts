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
