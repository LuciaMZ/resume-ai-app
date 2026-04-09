// =============================================================================
// Resume Data Model
// =============================================================================
// The resume data model is the contract between the editor and templates.
// It is template-agnostic: any template can render any valid ResumeData object.
// =============================================================================

/** Root data model for a resume */
export interface ResumeData {
  meta: ResumeMeta;
  personalInfo: PersonalInfo;
  sections: ResumeSection[];
}

/** Resume metadata — identity, template selection, timestamps, schema version */
export interface ResumeMeta {
  /** UUID, generated on first create */
  id: string;
  /** References the selected template ID */
  templateId: string;
  /** Optional template accent color (hex string) */
  accentColor?: string;
  /** ISO 8601 creation timestamp */
  createdAt: string;
  /** ISO 8601 last-updated timestamp */
  updatedAt: string;
  /** Schema version for future migrations (start at 1) */
  schemaVersion: number;
}

/** Contact and identity information */
export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** City, State/Country */
  location: string;
  website?: string;
  linkedIn?: string;
  github?: string;
  customLinks?: CustomLink[];
}

export interface CustomLink {
  label: string;
  url: string;
}

/** A resume section — container for entries of a single type */
export interface ResumeSection {
  /** UUID */
  id: string;
  type: SectionType;
  /** Display title (editable by user) */
  title: string;
  /** Toggle section visibility without deleting */
  visible: boolean;
  /** Sort order (0-based) */
  order: number;
  entries: SectionEntry[];
}

/** Supported section types */
export type SectionType =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'custom';

// =============================================================================
// Section Entry Types (Discriminated Union)
// =============================================================================

/** Discriminated union for different entry types */
export type SectionEntry =
  | SummaryEntry
  | ExperienceEntry
  | EducationEntry
  | SkillsEntry
  | CustomEntry;

export interface SummaryEntry {
  id: string;
  type: 'summary';
  /** Tiptap HTML string */
  content: string;
}

export interface ExperienceEntry {
  id: string;
  type: 'experience';
  jobTitle: string;
  company: string;
  location?: string;
  /** "YYYY-MM" format */
  startDate: string;
  /** null = "Present" */
  endDate: string | null;
  /** Tiptap HTML string */
  description: string;
}

export interface EducationEntry {
  id: string;
  type: 'education';
  institution: string;
  degree: string;
  /** Field of study */
  field?: string;
  /** "YYYY-MM" format */
  startDate: string;
  /** null = "Present" */
  endDate: string | null;
  /** Tiptap HTML string (optional details) */
  description?: string;
}

export interface SkillsEntry {
  id: string;
  type: 'skills';
  categories: SkillCategory[];
}

export interface SkillCategory {
  id: string;
  /** e.g., "Programming Languages" */
  name: string;
  /** e.g., ["TypeScript", "Python", "Go"] */
  skills: string[];
}

export interface CustomEntry {
  id: string;
  type: 'custom';
  /** Optional sub-heading */
  title?: string;
  subtitle?: string;
  /** "YYYY-MM" format */
  startDate?: string;
  /** null = "Present" */
  endDate?: string | null;
  /** Tiptap HTML string */
  description: string;
}
