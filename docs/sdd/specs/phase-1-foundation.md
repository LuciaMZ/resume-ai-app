# Phase 1: Foundation - Implementation Spec

**Phase:** 1 of 6
**Status:** In Progress
**Date:** 2026-03-06

---

## 1. Overview

Phase 1 establishes the project scaffold, type system, state management, persistence layer, and basic page layout for RESUME AI APP. No editor or template rendering happens in this phase -- only the foundational architecture that all subsequent phases build upon.

---

## 2. Project Scaffolding

### 2.1 Next.js Configuration

| Setting | Value |
|---------|-------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| Linting | ESLint |
| Source Directory | `src/` |
| Router | App Router |
| Import Alias | `@/*` mapped to `src/*` |

### 2.2 Dependencies

**Core:**
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` -- Drag-and-drop
- `uuid` + `@types/uuid` -- UUID generation
- `date-fns` -- Date formatting
- `lucide-react` -- Icons

**Tiptap (installed now, used in Phase 2):**
- `@tiptap/react`, `@tiptap/starter-kit`
- `@tiptap/extension-underline`, `@tiptap/extension-link`
- `@tiptap/pm`

---

## 3. File Structure (Phase 1 Deliverables)

```
src/
  app/
    layout.tsx              -- Root layout, ResumeProvider wrapper, Inter font
    page.tsx                -- 2-panel layout shell (editor | preview)
    globals.css             -- Tailwind base + custom styles
  types/
    resume.ts               -- ResumeData, PersonalInfo, sections, entries
    template.ts             -- TemplateDefinition, TemplateProps, TemplateRegistry
    ai.ts                   -- AISuggestion, SuggestionCategory, AIConfig
  lib/
    uuid.ts                 -- UUID generation (wraps `uuid` v4)
    storage.ts              -- localStorage read/write with namespaced keys
    defaults.ts             -- Default ResumeData with placeholder content
  providers/
    ResumeProvider.tsx       -- React Context + useReducer
  hooks/
    useResumeData.ts         -- Access resume context (data + dispatch)
    useLocalStorage.ts       -- Generic localStorage sync hook
    useAutoSave.ts           -- Debounced auto-save (~500ms)
```

---

## 4. Type Contracts

### 4.1 Resume Types (`src/types/resume.ts`)

All types follow the PRD Section 4.1 exactly. Key interfaces:

| Interface | Purpose | Key Fields |
|-----------|---------|------------|
| `ResumeData` | Root data model | `meta`, `personalInfo`, `sections` |
| `ResumeMeta` | Metadata | `id`, `templateId`, `accentColor?`, `createdAt`, `updatedAt`, `schemaVersion` |
| `PersonalInfo` | Contact info | `firstName`, `lastName`, `email`, `phone`, `location`, optional links |
| `ResumeSection` | Section container | `id`, `type`, `title`, `visible`, `order`, `entries` |
| `SectionType` | Union | `'summary' | 'experience' | 'education' | 'skills' | 'custom'` |
| `SectionEntry` | Discriminated union | `SummaryEntry | ExperienceEntry | EducationEntry | SkillsEntry | CustomEntry` |

Each entry type has `id: string` and `type: string` as discriminant fields.

### 4.2 Template Types (`src/types/template.ts`)

| Interface | Purpose |
|-----------|---------|
| `TemplateDefinition` | Registry entry: `id`, `name`, `description`, `thumbnail`, `component` |
| `TemplateProps` | Props for template components: `data: ResumeData`, `accentColor?: string` |
| `TemplateRegistry` | `Record<string, TemplateDefinition>` |

### 4.3 AI Types (`src/types/ai.ts`)

| Interface | Purpose |
|-----------|---------|
| `AISuggestion` | Single suggestion: `id`, `sectionId`, `sectionType`, `originalText`, `suggestion`, `category`, `timestamp` |
| `SuggestionCategory` | Union: `'rewrite' | 'action-verb' | 'quantify' | 'ats-optimize' | 'concise'` |
| `AIConfig` | API key + model config |

---

## 5. State Management Contract

### 5.1 ResumeAction Union

```typescript
type ResumeAction =
  | { type: 'SET_PERSONAL_INFO'; payload: Partial<PersonalInfo> }
  | { type: 'ADD_SECTION'; payload: { type: SectionType; title: string } }
  | { type: 'REMOVE_SECTION'; payload: { sectionId: string } }
  | { type: 'UPDATE_SECTION'; payload: { sectionId: string; updates: Partial<ResumeSection> } }
  | { type: 'REORDER_SECTIONS'; payload: { sectionIds: string[] } }
  | { type: 'ADD_ENTRY'; payload: { sectionId: string; entry: SectionEntry } }
  | { type: 'UPDATE_ENTRY'; payload: { sectionId: string; entryId: string; updates: Partial<SectionEntry> } }
  | { type: 'REMOVE_ENTRY'; payload: { sectionId: string; entryId: string } }
  | { type: 'REORDER_ENTRIES'; payload: { sectionId: string; entryIds: string[] } }
  | { type: 'SET_TEMPLATE'; payload: { templateId: string } }
  | { type: 'LOAD_RESUME'; payload: ResumeData }
  | { type: 'RESET_RESUME' };
```

### 5.2 Context Shape

```typescript
interface ResumeContextValue {
  state: ResumeData;
  dispatch: React.Dispatch<ResumeAction>;
}
```

### 5.3 Reducer Behavior

| Action | Behavior |
|--------|----------|
| `SET_PERSONAL_INFO` | Merges payload into `state.personalInfo`, updates `meta.updatedAt` |
| `ADD_SECTION` | Creates new `ResumeSection` with generated UUID, appends to `sections`, updates `meta.updatedAt` |
| `REMOVE_SECTION` | Filters out section by `sectionId`, updates `meta.updatedAt` |
| `UPDATE_SECTION` | Finds section by ID, merges `updates`, updates `meta.updatedAt` |
| `REORDER_SECTIONS` | Reorders `sections` array to match `sectionIds` order, re-assigns `order` values, updates `meta.updatedAt` |
| `ADD_ENTRY` | Finds section by `sectionId`, appends `entry` to its `entries`, updates `meta.updatedAt` |
| `UPDATE_ENTRY` | Finds section + entry by IDs, merges `updates` into entry, updates `meta.updatedAt` |
| `REMOVE_ENTRY` | Finds section by `sectionId`, filters out entry by `entryId`, updates `meta.updatedAt` |
| `REORDER_ENTRIES` | Reorders entries within section to match `entryIds` order, updates `meta.updatedAt` |
| `SET_TEMPLATE` | Sets `meta.templateId`, updates `meta.updatedAt` |
| `LOAD_RESUME` | Replaces entire state with payload |
| `RESET_RESUME` | Replaces state with `createDefaultResumeData()` |

---

## 6. Persistence Layer

### 6.1 Storage Keys

| Key | Data |
|-----|------|
| `resumeAIapp:resume` | `JSON.stringify(ResumeData)` |
| `resumeAIapp:ai-config` | `JSON.stringify(AIConfig)` |
| `resumeAIapp:settings` | `JSON.stringify(AppSettings)` |

### 6.2 Storage Utilities (`src/lib/storage.ts`)

- `getStorageItem<T>(key: string): T | null` -- Parse JSON from localStorage
- `setStorageItem<T>(key: string, value: T): void` -- Serialize to localStorage
- `removeStorageItem(key: string): void` -- Remove key
- `STORAGE_KEYS` constant object

### 6.3 Auto-Save Hook (`src/hooks/useAutoSave.ts`)

- Accepts `ResumeData` state
- Debounces writes to localStorage at 500ms
- Uses `useEffect` with cleanup
- Writes to `STORAGE_KEYS.RESUME_DATA`

---

## 7. Default Resume Data

The default `ResumeData` object includes 4 pre-configured sections with realistic placeholder content:

1. **Summary** -- Professional summary placeholder guiding the user
2. **Experience** -- One sample entry with placeholder job details
3. **Education** -- One sample entry with placeholder education details
4. **Skills** -- One skills entry with 3 categories (Technical, Soft Skills, Tools)

All IDs are generated fresh via `generateId()`. The `meta.templateId` defaults to `'classic'`.

---

## 8. Page Layout

### 8.1 Root Layout (`src/app/layout.tsx`)

- Imports Inter font from `next/font/google`
- Wraps `{children}` in `<ResumeProvider>`
- Sets HTML `lang="en"`, applies Inter font class
- Includes metadata: title "Resume AI APP", description

### 8.2 Main Page (`src/app/page.tsx`)

- `"use client"` directive (interacts with context)
- Top bar/header with:
  - App name "Resume AI APP" (left)
  - Placeholder spots for template selector, settings button, export button (right)
- 2-panel layout:
  - Left: Editor panel (placeholder `<div>` with "Editor" text and styling)
  - Right: Preview panel (placeholder `<div>` with "Preview" text and styling)
- Responsive: CSS Grid, stacks vertically below 1024px
- Modern Tailwind styling: subtle borders, proper spacing, clean visual hierarchy

---

## 9. Verification Checklist

- [ ] `npm run dev` starts without errors
- [ ] `npm run build` completes without errors
- [ ] All TypeScript types compile without errors
- [ ] ResumeProvider wraps the app and provides context
- [ ] Default resume data loads on mount
- [ ] Auto-save writes to localStorage within ~500ms of state change
- [ ] Page displays 2-panel layout with header
- [ ] Layout stacks vertically below 1024px
- [ ] All file paths match PRD Section 5.2 structure

---

*End of Phase 1 spec.*
