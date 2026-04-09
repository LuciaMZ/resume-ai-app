import type { SectionType, SkillCategory } from './resume';

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

/** Typed reducer patch generated from an accepted AI suggestion */
export type SuggestionPatch =
  | {
      sectionId: string;
      sectionType: 'summary';
      entryId: string;
      updates: { content: string };
    }
  | {
      sectionId: string;
      sectionType: 'experience' | 'education' | 'custom';
      entryId: string;
      updates: { description: string };
    }
  | {
      sectionId: string;
      sectionType: 'skills';
      entryId: string;
      updates: { categories: SkillCategory[] };
    };
