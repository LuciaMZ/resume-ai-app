// =============================================================================
// HTML Sanitization for Imported Resume Data
// =============================================================================
// Sanitizes all HTML string fields in ResumeData using DOMPurify.
// Only allows Tiptap-compatible tags and wraps plain text in <p> tags.
// =============================================================================

import type {
  ResumeData,
  ResumeSection,
  SectionEntry,
} from '@/types/resume';

/** Tags allowed by Tiptap's StarterKit + extensions used in this project */
const ALLOWED_TAGS = ['p', 'ul', 'ol', 'li', 'strong', 'em', 'u', 'a', 'br'];

/** Attributes allowed — only href on <a> tags */
const ALLOWED_ATTR = ['href'];

/**
 * Sanitize all HTML content in a ResumeData object.
 *
 * - Uses DOMPurify to strip disallowed tags/attributes
 * - Wraps plain text (not already HTML) in <p> tags
 * - Processes personalInfo.summary (if it existed), all section entries'
 *   description/content fields
 *
 * DOMPurify is lazy-loaded to keep it out of non-import code paths.
 *
 * @param data — A validated ResumeData object
 * @returns A new ResumeData with all HTML fields sanitized (does not mutate input)
 */
export function sanitizeResumeHTML(data: ResumeData): ResumeData {
  return {
    meta: { ...data.meta },
    personalInfo: { ...data.personalInfo },
    sections: data.sections.map(sanitizeSection),
  };
}

// =============================================================================
// Section / Entry Sanitization
// =============================================================================

function sanitizeSection(section: ResumeSection): ResumeSection {
  return {
    ...section,
    entries: section.entries.map((entry) => sanitizeEntry(entry)),
  };
}

function sanitizeEntry(entry: SectionEntry): SectionEntry {
  switch (entry.type) {
    case 'summary':
      return {
        ...entry,
        content: sanitizeHTML(entry.content),
      };

    case 'experience':
      return {
        ...entry,
        description: sanitizeHTML(entry.description),
      };

    case 'education':
      return {
        ...entry,
        description: entry.description ? sanitizeHTML(entry.description) : undefined,
      };

    case 'skills':
      // Skills entries have no HTML fields — just string arrays
      return {
        id: entry.id,
        type: entry.type,
        categories: entry.categories.map((cat) => ({ ...cat })),
      };

    case 'custom':
      return {
        id: entry.id,
        type: entry.type,
        title: entry.title,
        subtitle: entry.subtitle,
        startDate: entry.startDate,
        endDate: entry.endDate,
        description: sanitizeHTML(entry.description),
      };
  }
}

// =============================================================================
// Core Sanitization
// =============================================================================

/** DOMPurify instance — lazily initialized */
let purifyInstance: { sanitize: (dirty: string, config: Record<string, unknown>) => string } | null = null;

/**
 * Sanitize an HTML string:
 * 1. Wrap plain text in <p> tags if not already HTML
 * 2. Run through DOMPurify with Tiptap-compatible allowlist
 */
function sanitizeHTML(html: string): string {
  if (!html) return '';

  // Wrap plain text in <p> tags if it doesn't contain any HTML tags
  let processed = html;
  if (!containsHTML(processed)) {
    processed = `<p>${escapeHtml(processed)}</p>`;
  }

  // Use DOMPurify if available (browser environment)
  const purify = getPurifyInstance();
  if (purify) {
    return purify.sanitize(processed, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
    });
  }

  // Fallback: basic tag stripping for non-browser environments (e.g., tests)
  return stripDisallowedTags(processed);
}

/** Check if a string contains HTML tags */
function containsHTML(str: string): boolean {
  return /<[a-z][\s\S]*>/i.test(str);
}

/** Escape HTML entities in plain text */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Get or initialize the DOMPurify instance.
 * Returns null if DOMPurify is not available (e.g., SSR/test without DOM).
 */
function getPurifyInstance() {
  if (purifyInstance) return purifyInstance;

  try {
    // DOMPurify is a synchronous module — require it directly.
    // Using require() here instead of top-level import to support lazy loading
    // and to avoid issues with SSR where window is not defined.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const DOMPurify = require('dompurify');
    if (typeof window !== 'undefined') {
      purifyInstance = DOMPurify(window) as { sanitize: (dirty: string, config: Record<string, unknown>) => string };
      return purifyInstance;
    }
  } catch {
    // DOMPurify not available — use fallback
  }
  return null;
}

/**
 * Fallback sanitizer: strip tags not in the allowlist.
 * This is a best-effort fallback for non-browser environments.
 */
function stripDisallowedTags(html: string): string {
  // Build a regex that matches any tag NOT in our allowlist
  const allowedPattern = ALLOWED_TAGS.join('|');
  // Match opening tags not in allowlist
  const openTagRegex = new RegExp(`<(?!\\/?(${allowedPattern})(\\s|>|\\/))([^>]*)>`, 'gi');
  return html.replace(openTagRegex, '');
}
