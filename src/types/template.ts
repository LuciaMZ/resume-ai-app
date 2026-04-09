// =============================================================================
// Template System Types
// =============================================================================
// Templates are "dumb renderers" — they receive ResumeData and render HTML/CSS.
// They have zero knowledge of editing, persistence, or AI.
// =============================================================================

import type { ResumeData } from './resume';

/** Registry entry for a template */
export interface TemplateDefinition {
  /** Unique template identifier (e.g., 'classic', 'modern') */
  id: string;
  /** Display name shown in the template picker */
  name: string;
  /** Brief description for the template picker */
  description: string;
  /** Path to the preview thumbnail image */
  thumbnail: string;
  /** The React component that renders the template */
  component: React.ComponentType<TemplateProps>;
}

/** Props passed to every template component */
export interface TemplateProps {
  data: ResumeData;
  accentColor?: string;
}

/**
 * Central template registry.
 * Maps template IDs to their definitions.
 * Adding a template = creating a component + adding an entry here.
 */
export type TemplateRegistry = Record<string, TemplateDefinition>;
