import type { AISuggestion, SuggestionPatch } from '@/types/ai';
import type { ResumeData, SkillCategory } from '@/types/resume';
import { generateId } from '@/lib/uuid';
import { stripHtml } from './utils';

/**
 * Convert plain text with bullets into editor-friendly HTML.
 */
export function suggestionTextToHtml(text: string): string {
  const normalized = text
    .split('\n')
    .flatMap((line) => {
      const trimmed = line.trim();
      if (trimmed.includes(' • ') || trimmed.includes(' - ')) {
        const separator = trimmed.includes(' • ') ? ' • ' : ' - ';
        const parts = trimmed
          .split(separator)
          .map((p) => p.trim())
          .filter(Boolean);
        if (parts.length > 1) {
          return parts.map((p) => `- ${p}`);
        }
      }
      return [trimmed];
    });

  const parts: string[] = [];
  let inList = false;

  for (const line of normalized) {
    const isBullet = /^[-•*]\s+/.test(line);

    if (isBullet) {
      if (!inList) {
        parts.push('<ul>');
        inList = true;
      }
      const content = line.replace(/^[-•*]\s+/, '').trim();
      if (content) {
        parts.push(`<li><p>${content}</p></li>`);
      }
    } else {
      if (inList) {
        parts.push('</ul>');
        inList = false;
      }
      if (line) {
        parts.push(`<p>${line}</p>`);
      }
    }
  }

  if (inList) {
    parts.push('</ul>');
  }

  return parts.join('');
}

/**
 * Build a typed reducer patch for an accepted AI suggestion.
 */
export function buildSuggestionPatch(
  state: ResumeData,
  suggestion: AISuggestion
): SuggestionPatch | null {
  const section = state.sections.find((s) => s.id === suggestion.sectionId);
  if (!section || section.type !== suggestion.sectionType) return null;

  switch (section.type) {
    case 'summary': {
      const entry = section.entries.find((e) => e.type === 'summary');
      if (!entry) return null;
      return {
        sectionId: section.id,
        sectionType: 'summary',
        entryId: entry.id,
        updates: { content: suggestionTextToHtml(suggestion.suggestion) },
      };
    }

    case 'experience':
    case 'education':
    case 'custom': {
      const matchingEntry = section.entries.find((e) => {
        if (e.type === 'experience' || e.type === 'education' || e.type === 'custom') {
          return stripHtml(e.description ?? '') === suggestion.originalText.trim();
        }
        return false;
      });
      const fallbackEntry = section.entries.find(
        (e) => e.type === 'experience' || e.type === 'education' || e.type === 'custom'
      );
      const entry = matchingEntry ?? fallbackEntry;
      if (!entry) return null;

      return {
        sectionId: section.id,
        sectionType: section.type,
        entryId: entry.id,
        updates: { description: suggestionTextToHtml(suggestion.suggestion) },
      };
    }

    case 'skills': {
      const entry = section.entries.find((e) => e.type === 'skills');
      if (!entry) return null;

      const categories = parseSkillCategoriesFromSuggestion(suggestion.suggestion);
      if (categories.length === 0) return null;

      return {
        sectionId: section.id,
        sectionType: 'skills',
        entryId: entry.id,
        updates: { categories },
      };
    }
  }
}

function parseSkillCategoriesFromSuggestion(text: string): SkillCategory[] {
  const cleaned = text.trim();
  if (!cleaned) return [];

  const stripped = cleaned.replace(/^[-•*]\s+/gm, '');
  const tokens = stripped
    .split(/\n|,|;|\||\/+/)
    .map((token) => token.trim())
    .filter(Boolean);

  const uniqueSkills = Array.from(new Set(tokens));
  if (uniqueSkills.length === 0) return [];

  return [
    {
      id: generateId(),
      name: 'Tools',
      skills: uniqueSkills,
    },
  ];
}
