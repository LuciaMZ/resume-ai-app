'use client';

import {
  createContext,
  useReducer,
  useEffect,
  type ReactNode,
} from 'react';
import type {
  ResumeData,
  PersonalInfo,
  ResumeSection,
  SectionType,
  SectionEntry,
} from '@/types/resume';
import type { SuggestionPatch } from '@/types/ai';
import { createDefaultResumeData } from '@/lib/defaults';
import { generateId } from '@/lib/uuid';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '@/lib/storage';

// =============================================================================
// Action Types
// =============================================================================

export type ResumeAction =
  | { type: 'SET_PERSONAL_INFO'; payload: Partial<PersonalInfo> }
  | { type: 'ADD_SECTION'; payload: { type: SectionType; title: string } }
  | { type: 'REMOVE_SECTION'; payload: { sectionId: string } }
  | { type: 'UPDATE_SECTION'; payload: { sectionId: string; updates: Partial<ResumeSection> } }
  | { type: 'REORDER_SECTIONS'; payload: { sectionIds: string[] } }
  | { type: 'ADD_ENTRY'; payload: { sectionId: string; entry: SectionEntry } }
  | { type: 'UPDATE_ENTRY'; payload: { sectionId: string; entryId: string; updates: Record<string, unknown> } }
  | { type: 'REMOVE_ENTRY'; payload: { sectionId: string; entryId: string } }
  | { type: 'REORDER_ENTRIES'; payload: { sectionId: string; entryIds: string[] } }
  | { type: 'APPLY_SUGGESTION'; payload: SuggestionPatch }
  | { type: 'SET_TEMPLATE'; payload: { templateId: string } }
  | { type: 'LOAD_RESUME'; payload: ResumeData }
  | { type: 'RESET_RESUME' };

// =============================================================================
// Context
// =============================================================================

export interface ResumeContextValue {
  state: ResumeData;
  dispatch: React.Dispatch<ResumeAction>;
}

export const ResumeContext = createContext<ResumeContextValue | null>(null);

// =============================================================================
// Helpers
// =============================================================================

function withUpdatedTimestamp(state: ResumeData): ResumeData {
  return {
    ...state,
    meta: {
      ...state.meta,
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Create a blank entry for a given section type.
 */
function createBlankEntry(sectionType: SectionType): SectionEntry {
  const id = generateId();
  switch (sectionType) {
    case 'summary':
      return { id, type: 'summary', content: '' };
    case 'experience':
      return {
        id,
        type: 'experience',
        jobTitle: '',
        company: '',
        location: '',
        startDate: '',
        endDate: null,
        description: '',
      };
    case 'education':
      return {
        id,
        type: 'education',
        institution: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: null,
        description: '',
      };
    case 'skills':
      return {
        id,
        type: 'skills',
        categories: [],
      };
    case 'custom':
      return {
        id,
        type: 'custom',
        title: '',
        subtitle: '',
        description: '',
      };
  }
}

// =============================================================================
// Reducer
// =============================================================================

function resumeReducer(state: ResumeData, action: ResumeAction): ResumeData {
  switch (action.type) {
    // ── Personal Info ────────────────────────────────────────
    case 'SET_PERSONAL_INFO':
      return withUpdatedTimestamp({
        ...state,
        personalInfo: {
          ...state.personalInfo,
          ...action.payload,
        },
      });

    // ── Section CRUD ─────────────────────────────────────────
    case 'ADD_SECTION': {
      const newSection: ResumeSection = {
        id: generateId(),
        type: action.payload.type,
        title: action.payload.title,
        visible: true,
        order: state.sections.length,
        entries: [createBlankEntry(action.payload.type)],
      };
      return withUpdatedTimestamp({
        ...state,
        sections: [...state.sections, newSection],
      });
    }

    case 'REMOVE_SECTION':
      return withUpdatedTimestamp({
        ...state,
        sections: state.sections.filter(
          (s) => s.id !== action.payload.sectionId
        ),
      });

    case 'UPDATE_SECTION':
      return withUpdatedTimestamp({
        ...state,
        sections: state.sections.map((s) =>
          s.id === action.payload.sectionId
            ? { ...s, ...action.payload.updates }
            : s
        ),
      });

    case 'REORDER_SECTIONS': {
      const { sectionIds } = action.payload;
      const sectionMap = new Map(state.sections.map((s) => [s.id, s]));
      const seen = new Set<string>();
      const reorderedKnown = sectionIds
        .map((id) => {
          if (seen.has(id)) return null;
          const section = sectionMap.get(id);
          if (!section) return null;
          seen.add(id);
          return section;
        })
        .filter((s): s is ResumeSection => s !== null);

      // Preserve any sections omitted from payload to avoid accidental data loss.
      const unspecified = state.sections.filter((s) => !seen.has(s.id));
      const reordered = [...reorderedKnown, ...unspecified].map((s, index) => ({
        ...s,
        order: index,
      }));
      return withUpdatedTimestamp({
        ...state,
        sections: reordered,
      });
    }

    // ── Entry CRUD ───────────────────────────────────────────
    case 'ADD_ENTRY':
      return withUpdatedTimestamp({
        ...state,
        sections: state.sections.map((s) =>
          s.id === action.payload.sectionId
            ? { ...s, entries: [...s.entries, action.payload.entry] }
            : s
        ),
      });

    case 'UPDATE_ENTRY':
      return withUpdatedTimestamp({
        ...state,
        sections: state.sections.map((s) =>
          s.id === action.payload.sectionId
            ? {
                ...s,
                entries: s.entries.map((e) =>
                  e.id === action.payload.entryId
                    ? ({ ...e, ...action.payload.updates } as SectionEntry)
                    : e
                ),
              }
            : s
        ),
      });

    case 'REMOVE_ENTRY':
      return withUpdatedTimestamp({
        ...state,
        sections: state.sections.map((s) =>
          s.id === action.payload.sectionId
            ? {
                ...s,
                entries: s.entries.filter(
                  (e) => e.id !== action.payload.entryId
                ),
              }
            : s
        ),
      });

    case 'REORDER_ENTRIES': {
      const { sectionId, entryIds } = action.payload;
      return withUpdatedTimestamp({
        ...state,
        sections: state.sections.map((s) => {
          if (s.id !== sectionId) return s;
          const entryMap = new Map(s.entries.map((e) => [e.id, e]));
          const seen = new Set<string>();
          const reorderedKnown = entryIds
            .map((id) => entryMap.get(id))
            .filter((e): e is SectionEntry => {
              if (!e) return false;
              if (seen.has(e.id)) return false;
              seen.add(e.id);
              return true;
            });

          // Preserve omitted entries to avoid accidental data loss.
          const unspecified = s.entries.filter((e) => !seen.has(e.id));
          return { ...s, entries: [...reorderedKnown, ...unspecified] };
        }),
      });
    }

    case 'APPLY_SUGGESTION':
      return withUpdatedTimestamp({
        ...state,
        sections: state.sections.map((section) => {
          if (
            section.id !== action.payload.sectionId ||
            section.type !== action.payload.sectionType
          ) {
            return section;
          }

          return {
            ...section,
            entries: section.entries.map((entry) => {
              if (entry.id !== action.payload.entryId) return entry;

              switch (action.payload.sectionType) {
                case 'summary':
                  if (entry.type !== 'summary') return entry;
                  return { ...entry, ...action.payload.updates };
                case 'experience':
                  if (entry.type !== 'experience') return entry;
                  return { ...entry, ...action.payload.updates };
                case 'education':
                  if (entry.type !== 'education') return entry;
                  return { ...entry, ...action.payload.updates };
                case 'custom':
                  if (entry.type !== 'custom') return entry;
                  return { ...entry, ...action.payload.updates };
                case 'skills':
                  if (entry.type !== 'skills') return entry;
                  return { ...entry, ...action.payload.updates };
              }
            }),
          };
        }),
      });

    // ── Template ─────────────────────────────────────────────
    case 'SET_TEMPLATE':
      return withUpdatedTimestamp({
        ...state,
        meta: {
          ...state.meta,
          templateId: action.payload.templateId,
        },
      });

    // ── Bulk Operations ──────────────────────────────────────
    case 'LOAD_RESUME':
      return action.payload;

    case 'RESET_RESUME':
      return createDefaultResumeData();

    default:
      return state;
  }
}

// =============================================================================
// Provider Component
// =============================================================================

interface ResumeProviderProps {
  children: ReactNode;
}

export function ResumeProvider({ children }: ResumeProviderProps) {
  const [state, dispatch] = useReducer(
    resumeReducer,
    null,
    // Lazy initializer: load from localStorage or create default
    () => {
      const stored = getStorageItem<ResumeData>(STORAGE_KEYS.RESUME_DATA);
      return stored ?? createDefaultResumeData();
    }
  );

  // Persist to localStorage whenever state changes (handled by useAutoSave hook,
  // but we also do an initial save if the data was just created).
  useEffect(() => {
    // Only runs once on mount — ensures default data is persisted
    const stored = getStorageItem<ResumeData>(STORAGE_KEYS.RESUME_DATA);
    if (!stored) {
      setStorageItem(STORAGE_KEYS.RESUME_DATA, state);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ResumeContext.Provider value={{ state, dispatch }}>
      {children}
    </ResumeContext.Provider>
  );
}
