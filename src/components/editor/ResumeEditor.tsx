'use client';

import { useState, useRef, useEffect } from 'react';
import type { SectionType } from '@/types/resume';
import { useResumeData } from '@/hooks/useResumeData';
import { PersonalInfoForm } from './PersonalInfoForm';
import { SectionList } from './SectionList';
import {
  Plus,
  FileText,
  Briefcase,
  GraduationCap,
  Lightbulb,
  LayoutList,
} from 'lucide-react';

/** Default titles for each section type when adding a new section */
const SECTION_DEFAULTS: Record<SectionType, string> = {
  summary: 'Professional Summary',
  experience: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  custom: 'Custom Section',
};

/** Icons for each section type */
const SECTION_ICONS: Record<SectionType, React.ReactNode> = {
  summary: <FileText className="h-4 w-4" />,
  experience: <Briefcase className="h-4 w-4" />,
  education: <GraduationCap className="h-4 w-4" />,
  skills: <Lightbulb className="h-4 w-4" />,
  custom: <LayoutList className="h-4 w-4" />,
};

/** Section types that can only appear once */
const UNIQUE_SECTION_TYPES: SectionType[] = [
  'summary',
  'experience',
  'education',
  'skills',
];

interface AddSectionItem {
  type: SectionType;
  label: string;
  disabled: boolean;
}

export function ResumeEditor() {
  const { state, dispatch } = useResumeData();
  const [showAddMenu, setShowAddMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    }
    if (showAddMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAddMenu]);

  // Close on Escape
  useEffect(() => {
    if (!showAddMenu) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowAddMenu(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showAddMenu]);

  // Determine which section types are already present
  const existingTypes = new Set(state.sections.map((s) => s.type));

  const addSectionItems: AddSectionItem[] = (
    Object.keys(SECTION_DEFAULTS) as SectionType[]
  ).map((type) => ({
    type,
    label: SECTION_DEFAULTS[type],
    disabled: UNIQUE_SECTION_TYPES.includes(type) && existingTypes.has(type),
  }));

  function handleAddSection(type: SectionType) {
    dispatch({
      type: 'ADD_SECTION',
      payload: {
        type,
        title: SECTION_DEFAULTS[type],
      },
    });
    setShowAddMenu(false);
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Personal Information */}
      <PersonalInfoForm />

      {/* Divider */}
      <div className="border-t border-surface-200" />

      {/* Sections */}
      <div>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-surface-400">
          Resume Sections
        </h2>
        <SectionList sections={state.sections} />
      </div>

      {/* Add Section */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setShowAddMenu(!showAddMenu)}
          aria-expanded={showAddMenu}
          aria-haspopup="true"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-surface-300 px-4 py-3 text-sm font-medium text-surface-500 transition-all duration-150 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-600 hover:shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Section
        </button>

        {/* Dropdown menu */}
        {showAddMenu && (
          <div
            className="dropdown-enter absolute bottom-full left-0 right-0 z-10 mb-2 overflow-hidden rounded-xl border border-surface-200 bg-white shadow-lg"
            role="menu"
          >
            <div className="py-1">
              {addSectionItems.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  role="menuitem"
                  onClick={() => handleAddSection(item.type)}
                  disabled={item.disabled}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                    item.disabled
                      ? 'cursor-not-allowed text-surface-300'
                      : 'text-surface-700 hover:bg-primary-50 hover:text-primary-700'
                  }`}
                >
                  <span
                    className={
                      item.disabled ? 'text-surface-300' : 'text-surface-400'
                    }
                  >
                    {SECTION_ICONS[item.type]}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {item.disabled && (
                    <span className="text-xs text-surface-300">
                      Already added
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
