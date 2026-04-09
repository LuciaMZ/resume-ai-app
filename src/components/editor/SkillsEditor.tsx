'use client';

import { useState, type KeyboardEvent } from 'react';
import type { ResumeSection, SkillsEntry, SkillCategory } from '@/types/resume';
import { useResumeData } from '@/hooks/useResumeData';
import { generateId } from '@/lib/uuid';
import { Plus, X, Trash2, Lightbulb } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

interface SkillsEditorProps {
  section: ResumeSection;
}

interface CategoryEditorProps {
  category: SkillCategory;
  onUpdate: (updated: SkillCategory) => void;
  onRemove: () => void;
}

function CategoryEditor({ category, onUpdate, onRemove }: CategoryEditorProps) {
  const [inputValue, setInputValue] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const skill = inputValue.trim();
      if (skill && !category.skills.includes(skill)) {
        onUpdate({
          ...category,
          skills: [...category.skills, skill],
        });
        setInputValue('');
      }
    }
  }

  function removeSkill(skillToRemove: string) {
    onUpdate({
      ...category,
      skills: category.skills.filter((s) => s !== skillToRemove),
    });
  }

  const categoryLabel = category.name || 'this category';

  return (
    <>
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onConfirm={() => {
          onRemove();
          setShowDeleteConfirm(false);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
        title={`Delete "${categoryLabel}"?`}
        message="This category and all its skills will be permanently removed."
        confirmLabel="Delete"
        variant="danger"
      />

      <div className="rounded-lg border border-surface-200 bg-white p-4 transition-all duration-150 hover:border-surface-300">
        <div className="mb-3 flex items-center justify-between gap-3">
          <input
            type="text"
            value={category.name}
            onChange={(e) => onUpdate({ ...category, name: e.target.value })}
            placeholder="Category name (e.g., Languages)"
            className="flex-1 rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-sm font-medium text-surface-900 placeholder:text-surface-400 transition-all duration-150 hover:border-surface-300 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded p-1.5 text-surface-400 transition-colors hover:bg-red-50 hover:text-red-500"
            aria-label={`Remove ${categoryLabel}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Skills tags */}
        <div className="flex flex-wrap gap-1.5">
          {category.skills.map((skill) => (
            <span
              key={skill}
              className="group/tag inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-sm text-primary-700 transition-colors hover:bg-primary-100"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="ml-0.5 rounded-full p-0.5 text-primary-400 transition-colors hover:bg-primary-200 hover:text-primary-700"
                aria-label={`Remove ${skill}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}

          {/* Add skill input */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a skill + Enter"
            className="min-w-[140px] flex-1 rounded-full border border-dashed border-surface-300 bg-transparent px-3 py-1 text-sm text-surface-700 placeholder:text-surface-400 transition-all duration-150 hover:border-surface-400 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-500/20"
          />
        </div>
      </div>
    </>
  );
}

export function SkillsEditor({ section }: SkillsEditorProps) {
  const { dispatch } = useResumeData();

  // Skills section has exactly one SkillsEntry
  const entry = section.entries[0];
  if (!entry || entry.type !== 'skills') return null;

  const skillsEntry = entry as SkillsEntry;

  function updateCategories(updatedCategories: SkillCategory[]) {
    dispatch({
      type: 'UPDATE_ENTRY',
      payload: {
        sectionId: section.id,
        entryId: entry.id,
        updates: { categories: updatedCategories },
      },
    });
  }

  function updateCategory(index: number, updated: SkillCategory) {
    const newCategories = [...skillsEntry.categories];
    newCategories[index] = updated;
    updateCategories(newCategories);
  }

  function removeCategory(index: number) {
    const newCategories = skillsEntry.categories.filter((_, i) => i !== index);
    updateCategories(newCategories);
  }

  function addCategory() {
    const newCategory: SkillCategory = {
      id: generateId(),
      name: '',
      skills: [],
    };
    updateCategories([...skillsEntry.categories, newCategory]);
  }

  if (skillsEntry.categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface-100">
          <Lightbulb className="h-5 w-5 text-surface-400" />
        </div>
        <p className="mb-1 text-sm font-medium text-surface-600">
          No skill categories yet
        </p>
        <p className="mb-4 text-xs text-surface-400">
          Organize your skills into categories like "Languages" or "Frameworks".
        </p>
        <button
          type="button"
          onClick={addCategory}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-primary-700 hover:shadow-md active:bg-primary-800"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {skillsEntry.categories.map((category, index) => (
        <CategoryEditor
          key={category.id}
          category={category}
          onUpdate={(updated) => updateCategory(index, updated)}
          onRemove={() => removeCategory(index)}
        />
      ))}

      <button
        type="button"
        onClick={addCategory}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-surface-300 px-3 py-2.5 text-sm font-medium text-surface-500 transition-all duration-150 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-600"
      >
        <Plus className="h-4 w-4" />
        Add Category
      </button>
    </div>
  );
}
