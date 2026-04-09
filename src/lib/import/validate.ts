// =============================================================================
// Resume Data Validation & Fixing
// =============================================================================
// Validates AI-parsed resume data, coerces missing fields to safe defaults,
// and regenerates all UUIDs to prevent collisions with existing data.
// =============================================================================

import type {
  ResumeData,
  ResumeMeta,
  PersonalInfo,
  ResumeSection,
  SectionEntry,
  SectionType,
  SummaryEntry,
  ExperienceEntry,
  EducationEntry,
  SkillsEntry,
  SkillCategory,
  CustomEntry,
} from '@/types/resume';
import { generateId } from '@/lib/uuid';
import { ValidationError } from './errors';

/**
 * Validate and fix AI-parsed resume data.
 *
 * - Checks for required top-level structure (personalInfo, sections, meta)
 * - Coerces missing optional fields to safe defaults
 * - Regenerates ALL UUIDs (section IDs, entry IDs, skill category IDs)
 * - Sets fresh meta fields (createdAt, updatedAt, schemaVersion)
 *
 * @param data — Raw parsed data from AI (unknown shape)
 * @returns A valid ResumeData object ready to load into the builder
 * @throws ValidationError if the data is fundamentally unusable
 */
export function validateAndFixResumeData(data: unknown): ResumeData {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ValidationError(
      'AI response is not a valid object. Please try importing again.',
      'validation_failed'
    );
  }

  const raw = data as Record<string, unknown>;

  // ── Validate personalInfo exists ─────────────────────────────────────
  const rawPersonalInfo = raw.personalInfo;
  if (!rawPersonalInfo || typeof rawPersonalInfo !== 'object') {
    throw new ValidationError(
      'AI response is missing personal information. Please try importing again.',
      'validation_failed'
    );
  }

  // ── Validate sections exists ─────────────────────────────────────────
  const rawSections = raw.sections;
  if (!Array.isArray(rawSections)) {
    throw new ValidationError(
      'AI response is missing resume sections. Please try importing again.',
      'validation_failed'
    );
  }

  // ── Build validated data ─────────────────────────────────────────────
  const now = new Date().toISOString();

  const meta: ResumeMeta = buildMeta(raw.meta, now);
  const personalInfo: PersonalInfo = buildPersonalInfo(rawPersonalInfo as Record<string, unknown>);
  const sections: ResumeSection[] = buildSections(rawSections);

  return { meta, personalInfo, sections };
}

// =============================================================================
// Meta Builder
// =============================================================================

function buildMeta(rawMeta: unknown, now: string): ResumeMeta {
  const meta = (rawMeta && typeof rawMeta === 'object') ? rawMeta as Record<string, unknown> : {};

  return {
    id: generateId(),
    templateId: typeof meta.templateId === 'string' && meta.templateId ? meta.templateId : 'classic',
    accentColor: typeof meta.accentColor === 'string' ? meta.accentColor : undefined,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
  };
}

// =============================================================================
// PersonalInfo Builder
// =============================================================================

function buildPersonalInfo(raw: Record<string, unknown>): PersonalInfo {
  const info: PersonalInfo = {
    firstName: safeString(raw.firstName),
    lastName: safeString(raw.lastName),
    email: safeString(raw.email),
    phone: safeString(raw.phone),
    location: safeString(raw.location),
  };

  // Optional fields
  if (typeof raw.website === 'string' && raw.website) info.website = raw.website;
  if (typeof raw.linkedIn === 'string' && raw.linkedIn) info.linkedIn = raw.linkedIn;
  if (typeof raw.github === 'string' && raw.github) info.github = raw.github;

  // Custom links
  if (Array.isArray(raw.customLinks)) {
    const links = raw.customLinks
      .filter(
        (link): link is { label: string; url: string } =>
          typeof link === 'object' &&
          link !== null &&
          typeof (link as Record<string, unknown>).label === 'string' &&
          typeof (link as Record<string, unknown>).url === 'string'
      )
      .map((link) => ({ label: link.label, url: link.url }));

    if (links.length > 0) {
      info.customLinks = links;
    }
  }

  return info;
}

// =============================================================================
// Sections Builder
// =============================================================================

const VALID_SECTION_TYPES: SectionType[] = ['summary', 'experience', 'education', 'skills', 'custom'];

function buildSections(rawSections: unknown[]): ResumeSection[] {
  const sections: ResumeSection[] = [];

  for (let i = 0; i < rawSections.length; i++) {
    const rawSection = rawSections[i];
    if (!rawSection || typeof rawSection !== 'object') continue;

    const sec = rawSection as Record<string, unknown>;
    const type = safeString(sec.type) as SectionType;

    if (!VALID_SECTION_TYPES.includes(type)) continue;

    const entries = Array.isArray(sec.entries)
      ? buildEntries(sec.entries, type)
      : [];

    // Skip empty sections (no valid entries)
    if (entries.length === 0) continue;

    sections.push({
      id: generateId(),
      type,
      title: safeString(sec.title) || getDefaultSectionTitle(type),
      visible: sec.visible !== false, // Default to true
      order: sections.length,
      entries,
    });
  }

  return sections;
}

// =============================================================================
// Entry Builders
// =============================================================================

function buildEntries(rawEntries: unknown[], sectionType: SectionType): SectionEntry[] {
  const entries: SectionEntry[] = [];

  for (const rawEntry of rawEntries) {
    if (!rawEntry || typeof rawEntry !== 'object') continue;
    const entry = rawEntry as Record<string, unknown>;

    switch (sectionType) {
      case 'summary': {
        const built = buildSummaryEntry(entry);
        if (built) entries.push(built);
        break;
      }
      case 'experience': {
        const built = buildExperienceEntry(entry);
        if (built) entries.push(built);
        break;
      }
      case 'education': {
        const built = buildEducationEntry(entry);
        if (built) entries.push(built);
        break;
      }
      case 'skills': {
        const built = buildSkillsEntry(entry);
        if (built) entries.push(built);
        break;
      }
      case 'custom': {
        const built = buildCustomEntry(entry);
        if (built) entries.push(built);
        break;
      }
    }
  }

  return entries;
}

function buildSummaryEntry(raw: Record<string, unknown>): SummaryEntry | null {
  const content = safeString(raw.content);
  if (!content) return null;

  return {
    id: generateId(),
    type: 'summary',
    content,
  };
}

function buildExperienceEntry(raw: Record<string, unknown>): ExperienceEntry | null {
  // At minimum, need job title or company
  const jobTitle = safeString(raw.jobTitle);
  const company = safeString(raw.company);
  if (!jobTitle && !company) return null;

  const entry: ExperienceEntry = {
    id: generateId(),
    type: 'experience',
    jobTitle,
    company,
    startDate: safeDate(raw.startDate),
    endDate: raw.endDate === null || raw.endDate === 'null' ? null : safeDate(raw.endDate) || '',
    description: safeString(raw.description),
  };

  if (typeof raw.location === 'string' && raw.location) {
    entry.location = raw.location;
  }

  return entry;
}

function buildEducationEntry(raw: Record<string, unknown>): EducationEntry | null {
  const institution = safeString(raw.institution);
  const degree = safeString(raw.degree);
  if (!institution && !degree) return null;

  const entry: EducationEntry = {
    id: generateId(),
    type: 'education',
    institution,
    degree,
    startDate: safeDate(raw.startDate),
    endDate: raw.endDate === null || raw.endDate === 'null' ? null : safeDate(raw.endDate) || '',
  };

  if (typeof raw.field === 'string' && raw.field) {
    entry.field = raw.field;
  }
  if (typeof raw.description === 'string' && raw.description) {
    entry.description = raw.description;
  }

  return entry;
}

function buildSkillsEntry(raw: Record<string, unknown>): SkillsEntry | null {
  if (!Array.isArray(raw.categories)) return null;

  const categories: SkillCategory[] = [];
  for (const rawCat of raw.categories) {
    if (!rawCat || typeof rawCat !== 'object') continue;
    const cat = rawCat as Record<string, unknown>;

    const name = safeString(cat.name);
    if (!name) continue;

    const skills = Array.isArray(cat.skills)
      ? cat.skills.filter((s): s is string => typeof s === 'string' && s.length > 0)
      : [];

    if (skills.length === 0) continue;

    categories.push({
      id: generateId(),
      name,
      skills,
    });
  }

  if (categories.length === 0) return null;

  return {
    id: generateId(),
    type: 'skills',
    categories,
  };
}

function buildCustomEntry(raw: Record<string, unknown>): CustomEntry | null {
  const description = safeString(raw.description);
  const title = typeof raw.title === 'string' ? raw.title : undefined;
  // Need at least a title or description
  if (!description && !title) return null;

  const entry: CustomEntry = {
    id: generateId(),
    type: 'custom',
    description: description || '',
  };

  if (title) entry.title = title;
  if (typeof raw.subtitle === 'string' && raw.subtitle) entry.subtitle = raw.subtitle;
  if (typeof raw.startDate === 'string' && raw.startDate) entry.startDate = safeDate(raw.startDate);
  if (raw.endDate === null || raw.endDate === 'null') {
    entry.endDate = null;
  } else if (typeof raw.endDate === 'string' && raw.endDate) {
    entry.endDate = safeDate(raw.endDate);
  }

  return entry;
}

// =============================================================================
// Utilities
// =============================================================================

/** Safely coerce a value to a string, returning "" for non-strings */
function safeString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}

/**
 * Safely coerce a value to a YYYY-MM date string.
 * Accepts "YYYY-MM", "YYYY-MM-DD", "Month YYYY", or just "YYYY".
 */
function safeDate(value: unknown): string {
  if (typeof value !== 'string' || !value) return '';

  // Already in YYYY-MM format
  if (/^\d{4}-\d{2}$/.test(value)) return value;

  // YYYY-MM-DD → take first 7 chars
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.substring(0, 7);

  // Just a year
  if (/^\d{4}$/.test(value)) return `${value}-01`;

  // Try to parse common formats like "January 2023", "Jan 2023", "01/2023"
  const monthYearMatch = value.match(/(\w+)\s+(\d{4})/);
  if (monthYearMatch) {
    const month = parseMonth(monthYearMatch[1]);
    if (month) return `${monthYearMatch[2]}-${month}`;
    return `${monthYearMatch[2]}-01`;
  }

  // MM/YYYY
  const slashMatch = value.match(/^(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const mm = slashMatch[1].padStart(2, '0');
    return `${slashMatch[2]}-${mm}`;
  }

  return '';
}

const MONTH_MAP: Record<string, string> = {
  january: '01', jan: '01',
  february: '02', feb: '02',
  march: '03', mar: '03',
  april: '04', apr: '04',
  may: '05',
  june: '06', jun: '06',
  july: '07', jul: '07',
  august: '08', aug: '08',
  september: '09', sep: '09', sept: '09',
  october: '10', oct: '10',
  november: '11', nov: '11',
  december: '12', dec: '12',
};

function parseMonth(name: string): string | null {
  return MONTH_MAP[name.toLowerCase()] ?? null;
}

function getDefaultSectionTitle(type: SectionType): string {
  switch (type) {
    case 'summary': return 'Professional Summary';
    case 'experience': return 'Work Experience';
    case 'education': return 'Education';
    case 'skills': return 'Skills';
    case 'custom': return 'Additional';
  }
}
