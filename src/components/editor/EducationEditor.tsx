'use client';

import { useState } from 'react';
import type { ResumeSection, EducationEntry } from '@/types/resume';
import { useResumeData } from '@/hooks/useResumeData';
import { generateId } from '@/lib/uuid';
import { stripHtml } from '@/lib/ai';
import { TiptapEditor } from './TiptapEditor';
import { Plus, Trash2, GripVertical, GraduationCap } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface EducationEditorProps {
  section: ResumeSection;
  onFieldFocus?: (content: string) => void;
}

interface EntryCardProps {
  entry: EducationEntry;
  sectionId: string;
  onFieldFocus?: (content: string) => void;
}

function SortableEntryCard({ entry, sectionId, onFieldFocus }: EntryCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border border-surface-200 bg-white transition-all duration-150 ${
        isDragging ? 'shadow-lg opacity-50' : 'hover:border-surface-300'
      }`}
    >
      <EntryCardContent
        entry={entry}
        sectionId={sectionId}
        onFieldFocus={onFieldFocus}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

interface EntryCardContentProps {
  entry: EducationEntry;
  sectionId: string;
  onFieldFocus?: (content: string) => void;
  dragHandleProps?: Record<string, unknown>;
}

function EntryCardContent({
  entry,
  sectionId,
  onFieldFocus,
  dragHandleProps,
}: EntryCardContentProps) {
  const { dispatch } = useResumeData();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  function updateField(field: string, value: string | null | undefined) {
    dispatch({
      type: 'UPDATE_ENTRY',
      payload: {
        sectionId,
        entryId: entry.id,
        updates: { [field]: value },
      },
    });
  }

  function handleDelete() {
    dispatch({
      type: 'REMOVE_ENTRY',
      payload: { sectionId, entryId: entry.id },
    });
    setShowDeleteConfirm(false);
  }

  const isPresent = entry.endDate === null;
  const entryLabel = entry.institution || entry.degree || 'this education entry';

  return (
    <>
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        title={`Delete "${entryLabel}"?`}
        message="This entry will be permanently removed."
        confirmLabel="Delete"
        variant="danger"
      />

      <div className="p-4">
        {/* Entry header with drag handle and delete */}
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            className="cursor-grab rounded p-1 text-surface-300 transition-colors hover:bg-surface-100 hover:text-surface-500 active:cursor-grabbing"
            aria-label="Drag to reorder"
            {...dragHandleProps}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded p-1.5 text-surface-400 transition-colors hover:bg-red-50 hover:text-red-500"
            aria-label={`Delete ${entryLabel}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Institution & Degree */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-surface-600">
                Institution
              </label>
              <input
                type="text"
                value={entry.institution}
                onChange={(e) => updateField('institution', e.target.value)}
                placeholder="University of California"
                className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 placeholder:text-surface-400 transition-all duration-150 hover:border-surface-300 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:shadow-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-surface-600">
                Degree
              </label>
              <input
                type="text"
                value={entry.degree}
                onChange={(e) => updateField('degree', e.target.value)}
                placeholder="Bachelor of Science"
                className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 placeholder:text-surface-400 transition-all duration-150 hover:border-surface-300 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:shadow-sm"
              />
            </div>
          </div>

          {/* Field of Study */}
          <div>
            <label className="mb-1 block text-xs font-medium text-surface-600">
              Field of Study
            </label>
            <input
              type="text"
              value={entry.field ?? ''}
              onChange={(e) => updateField('field', e.target.value)}
              placeholder="Computer Science"
              className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 placeholder:text-surface-400 transition-all duration-150 hover:border-surface-300 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:shadow-sm"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-surface-600">
                Start Date
              </label>
              <input
                type="text"
                value={entry.startDate}
                onChange={(e) => updateField('startDate', e.target.value)}
                placeholder="2020-09"
                className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 placeholder:text-surface-400 transition-all duration-150 hover:border-surface-300 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:shadow-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-surface-600">
                End Date
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={isPresent ? '' : (entry.endDate ?? '')}
                  onChange={(e) => updateField('endDate', e.target.value)}
                  placeholder="2024-05"
                  disabled={isPresent}
                  className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-900 placeholder:text-surface-400 transition-all duration-150 hover:border-surface-300 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:shadow-sm disabled:bg-surface-50 disabled:text-surface-400 disabled:hover:border-surface-200"
                />
              </div>
              <label className="mt-1.5 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPresent}
                  onChange={(e) =>
                    updateField('endDate', e.target.checked ? null : '')
                  }
                  className="h-3.5 w-3.5 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-xs text-surface-500">Present</span>
              </label>
            </div>
          </div>

          {/* Description (optional) */}
          <div>
            <label className="mb-1 block text-xs font-medium text-surface-600">
              Description{' '}
              <span className="font-normal text-surface-400">(optional)</span>
            </label>
            <TiptapEditor
              content={entry.description ?? ''}
              onUpdate={(html) => updateField('description', html)}
              onFocus={() => onFieldFocus?.(stripHtml(entry.description ?? ''))}
              placeholder="Relevant coursework, honors, activities..."
            />
          </div>
        </div>
      </div>
    </>
  );
}

export function EducationEditor({ section, onFieldFocus }: EducationEditorProps) {
  const { dispatch } = useResumeData();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const entries = section.entries.filter(
    (e): e is EducationEntry => e.type === 'education'
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = entries.findIndex((e) => e.id === active.id);
    const newIndex = entries.findIndex((e) => e.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = [...entries.map((e) => e.id)];
    newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, active.id as string);

    dispatch({
      type: 'REORDER_ENTRIES',
      payload: { sectionId: section.id, entryIds: newOrder },
    });
  }

  function addEntry() {
    const newEntry: EducationEntry = {
      id: generateId(),
      type: 'education',
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: null,
      description: '',
    };
    dispatch({
      type: 'ADD_ENTRY',
      payload: { sectionId: section.id, entry: newEntry },
    });
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface-100">
          <GraduationCap className="h-5 w-5 text-surface-400" />
        </div>
        <p className="mb-1 text-sm font-medium text-surface-600">
          No education entries yet
        </p>
        <p className="mb-4 text-xs text-surface-400">
          Add your academic background and qualifications.
        </p>
        <button
          type="button"
          onClick={addEntry}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-primary-700 hover:shadow-md active:bg-primary-800"
        >
          <Plus className="h-4 w-4" />
          Add Education
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={entries.map((e) => e.id)}
          strategy={verticalListSortingStrategy}
        >
          {entries.map((entry) => (
            <SortableEntryCard
              key={entry.id}
              entry={entry}
              sectionId={section.id}
              onFieldFocus={onFieldFocus}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={addEntry}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-surface-300 px-3 py-2.5 text-sm font-medium text-surface-500 transition-all duration-150 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-600"
      >
        <Plus className="h-4 w-4" />
        Add Education
      </button>
    </div>
  );
}
