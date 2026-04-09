'use client';

import { User, Mail, Phone, LayoutList, CheckCircle } from 'lucide-react';
import type { ResumeData, SectionType } from '@/types/resume';

// =============================================================================
// ImportPreview
// =============================================================================

interface ImportPreviewProps {
  data: ResumeData;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Maps section types to human-readable labels */
const sectionTypeLabels: Record<SectionType, string> = {
  summary: 'Summary',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  custom: 'Custom',
};

export function ImportPreview({ data, onConfirm, onCancel }: ImportPreviewProps) {
  const fullName = [data.personalInfo.firstName, data.personalInfo.lastName]
    .filter(Boolean)
    .join(' ');

  const visibleSections = data.sections.filter((s) => s.visible);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-surface-900">
            Resume Parsed Successfully
          </h3>
          <p className="mt-0.5 text-sm text-surface-500">
            Review the extracted data before importing.
          </p>
        </div>
      </div>

      {/* Personal Info */}
      <div className="rounded-lg border border-surface-200 bg-surface-50 p-4">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400">
          Personal Information
        </h4>
        <div className="space-y-2">
          {fullName && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 shrink-0 text-surface-400" />
              <span className="font-medium text-surface-800">{fullName}</span>
            </div>
          )}
          {data.personalInfo.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 shrink-0 text-surface-400" />
              <span className="text-surface-600">{data.personalInfo.email}</span>
            </div>
          )}
          {data.personalInfo.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 shrink-0 text-surface-400" />
              <span className="text-surface-600">{data.personalInfo.phone}</span>
            </div>
          )}
          {!fullName && !data.personalInfo.email && !data.personalInfo.phone && (
            <p className="text-sm text-surface-400 italic">
              No personal information detected.
            </p>
          )}
        </div>
      </div>

      {/* Sections Summary */}
      <div className="rounded-lg border border-surface-200 bg-surface-50 p-4">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400">
          Sections ({visibleSections.length})
        </h4>
        {visibleSections.length > 0 ? (
          <div className="space-y-2">
            {visibleSections.map((section) => (
              <div
                key={section.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <LayoutList className="h-4 w-4 shrink-0 text-surface-400" />
                  <span className="font-medium text-surface-700">
                    {section.title || sectionTypeLabels[section.type]}
                  </span>
                </div>
                <span className="text-xs text-surface-400">
                  {section.entries.length}{' '}
                  {section.entries.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-surface-400 italic">No sections detected.</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-primary-700 hover:shadow-md active:bg-primary-800"
        >
          Import Resume
        </button>
      </div>
    </div>
  );
}
