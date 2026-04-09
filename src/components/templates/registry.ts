// =============================================================================
// Template Registry
// =============================================================================
// Central registry of all available resume templates.
// To add a new template:
//   1. Create a component implementing TemplateProps
//   2. Add an entry to the templateRegistry below
// =============================================================================

import type { TemplateDefinition, TemplateRegistry } from '@/types/template';
import { ClassicTemplate } from './classic/ClassicTemplate';
import { ModernTemplate } from './modern/ModernTemplate';
import { AcademicTemplate } from './academic/AcademicTemplate';
import { CompactTemplate } from './compact/CompactTemplate';

/**
 * Central map of all registered templates.
 * Key = template ID, Value = TemplateDefinition.
 */
export const templateRegistry: TemplateRegistry = {
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'Clean, single-column professional layout with subtle accents',
    thumbnail: '/templates/classic-thumb.png',
    component: ClassicTemplate,
  },
  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'Two-column layout with accent sidebar for a bold, contemporary look',
    thumbnail: '/templates/modern-thumb.png',
    component: ModernTemplate,
  },
  academic: {
    id: 'academic',
    name: 'Academic',
    description: 'Dense, serif-based scholarly CV for research and academia',
    thumbnail: '/templates/academic-thumb.png',
    component: AcademicTemplate,
  },
  compact: {
    id: 'compact',
    name: 'Compact',
    description: 'Space-optimized layout that fits 30-40% more content per page',
    thumbnail: '/templates/compact-thumb.png',
    component: CompactTemplate,
  },
};

/**
 * Look up a single template by ID.
 * Returns undefined if the template ID is not registered.
 */
export function getTemplate(id: string): TemplateDefinition | undefined {
  return templateRegistry[id];
}

/**
 * Get all registered templates as an array.
 * Useful for populating template selector UIs.
 */
export function getAllTemplates(): TemplateDefinition[] {
  return Object.values(templateRegistry);
}
