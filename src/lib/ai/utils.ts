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
