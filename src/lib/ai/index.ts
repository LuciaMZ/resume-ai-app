import type { AIConfig, AISuggestion, AIModel, LegacyAIConfig } from '@/types/ai';
import type { SectionType } from '@/types/resume';
import { registerProvider, getProvider, getAllProviders } from './registry';
import { openaiProvider } from './providers/openai';
import { geminiProvider } from './providers/gemini';

// Re-export shared utilities for external consumers
export { AIError, stripHtml } from './utils';
export { buildSuggestionPatch, suggestionTextToHtml } from './applySuggestion';
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
