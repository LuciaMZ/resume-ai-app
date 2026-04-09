'use client';

import { useState } from 'react';
import type { ResumeSection } from '@/types/resume';
import { useResumeData } from '@/hooks/useResumeData';
import { SectionEditor } from './SectionEditor';
import { LayoutList } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SectionListProps {
  sections: ResumeSection[];
}

interface SortableSectionProps {
  section: ResumeSection;
}

function SortableSection({ section }: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`transition-opacity duration-150 ${isDragging ? 'opacity-50' : ''}`}
    >
      <SectionEditor
        section={section}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

export function SectionList({ sections }: SectionListProps) {
  const { dispatch } = useResumeData();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);
  const activeSection = activeId
    ? sortedSections.find((s) => s.id === activeId)
    : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedSections.findIndex((s) => s.id === active.id);
    const newIndex = sortedSections.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = sortedSections.map((s) => s.id);
    newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, active.id as string);

    dispatch({
      type: 'REORDER_SECTIONS',
      payload: { sectionIds: newOrder },
    });
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  if (sortedSections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-surface-200 py-12 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-100">
          <LayoutList className="h-6 w-6 text-surface-400" />
        </div>
        <p className="mb-1 text-sm font-medium text-surface-600">
          No sections yet
        </p>
        <p className="text-xs text-surface-400">
          Click "Add Section" below to get started building your resume.
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={sortedSections.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {sortedSections.map((section) => (
            <SortableSection key={section.id} section={section} />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeSection ? (
          <div className="rounded-xl border-2 border-primary-300 bg-white shadow-xl">
            <div className="flex items-center gap-2 border-b border-surface-100 bg-primary-50 px-3 py-2.5">
              <div className="p-1 text-primary-500">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="9" cy="5" r="1" />
                  <circle cx="9" cy="12" r="1" />
                  <circle cx="9" cy="19" r="1" />
                  <circle cx="15" cy="5" r="1" />
                  <circle cx="15" cy="12" r="1" />
                  <circle cx="15" cy="19" r="1" />
                </svg>
              </div>
              <span className="flex-1 text-sm font-semibold text-surface-800">
                {activeSection.title}
              </span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
