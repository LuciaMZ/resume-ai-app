'use client';

import type { ResumeSection } from '@/types/resume';
import { useResumeData } from '@/hooks/useResumeData';
import { stripHtml } from '@/lib/ai';
import { TiptapEditor } from './TiptapEditor';

interface SummaryEditorProps {
  section: ResumeSection;
  onFieldFocus?: (content: string) => void;
}

export function SummaryEditor({ section, onFieldFocus }: SummaryEditorProps) {
  const { dispatch } = useResumeData();

  // Summary always has exactly one entry
  const entry = section.entries[0];
  if (!entry || entry.type !== 'summary') return null;

  return (
    <div>
      <TiptapEditor
        content={entry.content}
        onFocus={() => onFieldFocus?.(stripHtml(entry.content))}
        onUpdate={(html) => {
          dispatch({
            type: 'UPDATE_ENTRY',
            payload: {
              sectionId: section.id,
              entryId: entry.id,
              updates: { content: html },
            },
          });
        }}
        placeholder="Write a compelling professional summary that highlights your key strengths and career objectives..."
      />
    </div>
  );
}
