'use client';

import { useState, useCallback } from 'react';
import type { ResumeSection } from '@/types/resume';
import { useResumeData } from '@/hooks/useResumeData';
import { useActiveSection } from '@/hooks/useActiveSection';
import { useToast } from '@/hooks/useToast';
import { stripHtml } from '@/lib/ai';
import { GripVertical, ChevronDown, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { SummaryEditor } from './SummaryEditor';
import { ExperienceEditor } from './ExperienceEditor';
import { EducationEditor } from './EducationEditor';
import { SkillsEditor } from './SkillsEditor';
import { CustomSectionEditor } from './CustomSectionEditor';

interface SectionEditorProps {
  section: ResumeSection;
  dragHandleProps?: Record<string, unknown>;
}

function renderSectionContent(
  section: ResumeSection,
  onFieldFocus: (content: string) => void
) {
  switch (section.type) {
    case 'summary':
      return <SummaryEditor section={section} onFieldFocus={onFieldFocus} />;
    case 'experience':
      return <ExperienceEditor section={section} onFieldFocus={onFieldFocus} />;
    case 'education':
      return <EducationEditor section={section} onFieldFocus={onFieldFocus} />;
    case 'skills':
      return <SkillsEditor section={section} />;
    case 'custom':
      return <CustomSectionEditor section={section} onFieldFocus={onFieldFocus} />;
    default:
      return null;
  }
}

/**
 * Extract plain text content from a section's entries for sending to the AI.
 * Strips HTML tags and concatenates relevant fields.
 */
function extractSectionContent(section: ResumeSection): string {
  return section.entries
    .map((entry) => {
      switch (entry.type) {
        case 'summary':
          return stripHtml(entry.content);
        case 'experience':
          return [
            entry.jobTitle,
            entry.company,
            stripHtml(entry.description),
          ]
            .filter(Boolean)
            .join(' ');
        case 'education':
          return [
            entry.institution,
            entry.degree,
            entry.field,
            stripHtml(entry.description ?? ''),
          ]
            .filter(Boolean)
            .join(' ');
        case 'skills':
          return entry.categories
            .map((cat) => `${cat.name}: ${cat.skills.join(', ')}`)
            .join('. ');
        case 'custom':
          return [
            entry.title,
            entry.subtitle,
            stripHtml(entry.description),
          ]
            .filter(Boolean)
            .join(' ');
        default:
          return '';
      }
    })
    .filter(Boolean)
    .join('\n');
}

export function SectionEditor({ section, dragHandleProps }: SectionEditorProps) {
  const { dispatch } = useResumeData();
  const { setActiveSection } = useActiveSection();
  const { addToast } = useToast();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const handleFieldFocus = useCallback(
    (content: string) => {
      setActiveSection(section.id, section.type, content);
    },
    [section.id, section.type, setActiveSection]
  );

  const handleFocus = useCallback(() => {
    const content = extractSectionContent(section);
    setActiveSection(section.id, section.type, content);
  }, [section, setActiveSection]);

  function handleDelete() {
    dispatch({
      type: 'REMOVE_SECTION',
      payload: { sectionId: section.id },
    });
    setShowDeleteConfirm(false);
    addToast(`"${section.title}" deleted`, 'success');
  }

  function handleTitleChange(newTitle: string) {
    dispatch({
      type: 'UPDATE_SECTION',
      payload: {
        sectionId: section.id,
        updates: { title: newTitle },
      },
    });
  }

  return (
    <>
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        title={`Delete "${section.title}"?`}
        message="This will permanently remove this section and all its content. This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />

      <div className="group/section overflow-hidden rounded-xl border border-surface-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
        {/* Section Header */}
        <div className="flex items-center gap-2 border-b border-surface-100 bg-surface-50/60 px-3 py-2.5">
          {/* Drag Handle */}
          <button
            type="button"
            className="cursor-grab rounded p-1 text-surface-300 transition-colors hover:bg-surface-200 hover:text-surface-500 active:cursor-grabbing"
            aria-label={`Drag to reorder ${section.title} section`}
            {...dragHandleProps}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          {/* Section Title (click to edit) */}
          {isEditingTitle ? (
            <input
              type="text"
              value={section.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsEditingTitle(false);
              }}
              autoFocus
              className="flex-1 rounded border border-primary-300 bg-white px-2 py-0.5 text-sm font-semibold text-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              aria-label="Edit section title"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingTitle(true)}
              className="flex-1 rounded px-2 py-0.5 text-left text-sm font-semibold text-surface-800 transition-colors hover:bg-surface-100 hover:text-primary-700"
              title="Click to edit title"
              aria-label={`Edit title: ${section.title}`}
            >
              {section.title}
            </button>
          )}

          {/* Collapse/Expand */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded p-1.5 text-surface-400 transition-all duration-200 hover:bg-surface-100 hover:text-surface-600"
            aria-label={isExpanded ? `Collapse ${section.title}` : `Expand ${section.title}`}
            aria-expanded={isExpanded}
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded p-1.5 text-surface-400 transition-colors hover:bg-red-50 hover:text-red-500"
            aria-label={`Delete ${section.title} section`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Section Content (collapsible) */}
        <div
          className="section-collapse-wrapper"
          data-collapsed={!isExpanded}
        >
          <div className="section-collapse-inner">
            <div className="p-4" onFocus={handleFocus}>
              {renderSectionContent(section, handleFieldFocus)}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
