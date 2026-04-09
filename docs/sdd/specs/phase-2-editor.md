# Phase 2: Editor - Implementation Spec

**Phase:** 2 of 6
**Status:** In Progress
**Date:** 2026-03-06
**Depends on:** Phase 1 (Foundation) - COMPLETE

---

## 1. Overview

Phase 2 builds the complete editor interface for RESUME AI APP. This includes the personal information form, Tiptap rich text editors, section-specific editor components, drag-and-drop reordering for both sections and entries, and the ability to add/remove sections. All editor components connect to the existing `ResumeProvider` state management from Phase 1.

---

## 2. Dependencies

All dependencies are already installed (Phase 1):

| Package | Version | Purpose |
|---------|---------|---------|
| `@tiptap/react` | ^3.20.1 | React bindings for Tiptap editor |
| `@tiptap/starter-kit` | ^3.20.1 | Bold, italic, lists, headings, etc. |
| `@tiptap/extension-underline` | ^3.20.1 | Underline formatting |
| `@tiptap/extension-link` | ^3.20.1 | Hyperlink support |
| `@dnd-kit/core` | ^6.3.1 | Drag-and-drop foundation |
| `@dnd-kit/sortable` | ^10.0.0 | Sortable list utilities |
| `@dnd-kit/utilities` | ^3.2.2 | CSS transform utilities |
| `lucide-react` | ^0.577.0 | Icons |

---

## 3. File Structure

```
src/components/editor/
  ResumeEditor.tsx         -- Main editor container
  PersonalInfoForm.tsx     -- Structured contact info form
  SectionList.tsx           -- Sortable list of sections (DnD)
  SectionEditor.tsx         -- Generic wrapper: header, collapse, delete, drag handle
  SummaryEditor.tsx         -- Tiptap editor for summary
  ExperienceEditor.tsx      -- Form fields + Tiptap, multi-entry with DnD
  EducationEditor.tsx       -- Form fields + optional Tiptap, multi-entry with DnD
  SkillsEditor.tsx          -- Category/tag editor
  TiptapEditor.tsx          -- Reusable Tiptap component
  EditorToolbar.tsx         -- Formatting toolbar for Tiptap
```

---

## 4. Component Contracts

### 4.1 TiptapEditor

**File:** `src/components/editor/TiptapEditor.tsx`

| Prop | Type | Description |
|------|------|-------------|
| `content` | `string` | HTML string (initial content) |
| `onUpdate` | `(html: string) => void` | Callback fired on every content change |
| `placeholder?` | `string` | Placeholder text when editor is empty |

**Extensions:** StarterKit (without heading), Underline, Link (openOnClick: false, autolink: true)

**Behavior:**
- Renders EditorToolbar above the content area
- Calls `onUpdate` on every transaction that changes content
- Styled with a border, rounded corners, focus ring
- Content area has min-height of ~120px

### 4.2 EditorToolbar

**File:** `src/components/editor/EditorToolbar.tsx`

| Prop | Type | Description |
|------|------|-------------|
| `editor` | `Editor \| null` | Tiptap editor instance |

**Toolbar buttons:**

| Button | Command | Active state |
|--------|---------|-------------|
| Bold | `toggleBold()` | `editor.isActive('bold')` |
| Italic | `toggleItalic()` | `editor.isActive('italic')` |
| Underline | `toggleUnderline()` | `editor.isActive('underline')` |
| Bullet List | `toggleBulletList()` | `editor.isActive('bulletList')` |
| Ordered List | `toggleOrderedList()` | `editor.isActive('orderedList')` |
| Link | `setLink()` / `unsetLink()` | `editor.isActive('link')` |

**Link behavior:** Clicking the link button prompts for a URL (window.prompt for MVP). If text is selected and user provides a URL, set the link. If the link button is active, unset the link.

### 4.3 PersonalInfoForm

**File:** `src/components/editor/PersonalInfoForm.tsx`

**State:** Reads `state.personalInfo` from `useResumeData()`, dispatches `SET_PERSONAL_INFO`.

| Field | Input Type | Required |
|-------|-----------|----------|
| First Name | text | Yes |
| Last Name | text | Yes |
| Email | email | Yes |
| Phone | tel | No |
| Location | text | No |
| Website | url | No |
| LinkedIn | url | No |
| GitHub | url | No |

**Layout:** 2-column grid for name fields, single column for the rest. Consistent label + input styling.

**Change handling:** Each input dispatches `SET_PERSONAL_INFO` with a partial update on `onChange`.

### 4.4 SummaryEditor

**File:** `src/components/editor/SummaryEditor.tsx`

| Prop | Type | Description |
|------|------|-------------|
| `section` | `ResumeSection` | The summary section (has exactly 1 entry) |

**Behavior:**
- Renders a single TiptapEditor
- Summary sections always have exactly one `SummaryEntry`
- On content change, dispatches `UPDATE_ENTRY` with `{ content: html }`

### 4.5 ExperienceEditor

**File:** `src/components/editor/ExperienceEditor.tsx`

| Prop | Type | Description |
|------|------|-------------|
| `section` | `ResumeSection` | The experience section |

**Per-entry fields:**

| Field | Input Type | Dispatches |
|-------|-----------|-----------|
| Job Title | text | `UPDATE_ENTRY { jobTitle }` |
| Company | text | `UPDATE_ENTRY { company }` |
| Location | text | `UPDATE_ENTRY { location }` |
| Start Date | text (YYYY-MM) | `UPDATE_ENTRY { startDate }` |
| End Date | text (YYYY-MM) or "Present" checkbox | `UPDATE_ENTRY { endDate }` |
| Description | TiptapEditor | `UPDATE_ENTRY { description }` |

**Features:**
- Multiple entries, each in a card
- "Add Experience" button dispatches `ADD_ENTRY` with a blank ExperienceEntry
- Each entry has a delete button dispatching `REMOVE_ENTRY`
- Entries reorderable via @dnd-kit/sortable, dispatches `REORDER_ENTRIES`
- "Present" checkbox sets `endDate` to `null`, unchecking restores to empty string
- Empty state when no entries

### 4.6 EducationEditor

**File:** `src/components/editor/EducationEditor.tsx`

Same pattern as ExperienceEditor but for education fields:

| Field | Input Type | Dispatches |
|-------|-----------|-----------|
| Institution | text | `UPDATE_ENTRY { institution }` |
| Degree | text | `UPDATE_ENTRY { degree }` |
| Field of Study | text | `UPDATE_ENTRY { field }` |
| Start Date | text (YYYY-MM) | `UPDATE_ENTRY { startDate }` |
| End Date | text (YYYY-MM) or "Present" checkbox | `UPDATE_ENTRY { endDate }` |
| Description | TiptapEditor (optional) | `UPDATE_ENTRY { description }` |

### 4.7 SkillsEditor

**File:** `src/components/editor/SkillsEditor.tsx`

| Prop | Type | Description |
|------|------|-------------|
| `section` | `ResumeSection` | The skills section (has exactly 1 SkillsEntry) |

**Behavior:**
- Skills section has one `SkillsEntry` containing `categories: SkillCategory[]`
- Each category has a `name` (text input) and `skills` (string array rendered as tags)
- Adding a skill: text input + Enter key appends to the array
- Removing a skill: click X on the tag
- "Add Category" button adds a new empty category
- "Remove Category" button removes a category (with inline confirmation or immediate)
- All changes dispatch `UPDATE_ENTRY` with the updated `categories` array

**Tag styling:** Pill-shaped, surface-200 background, surface-700 text, small X button

### 4.8 SectionEditor

**File:** `src/components/editor/SectionEditor.tsx`

| Prop | Type | Description |
|------|------|-------------|
| `section` | `ResumeSection` | The section to render |
| `dragHandleProps?` | object | Props from useSortable for the drag handle |

**Features:**
- Header row: drag handle icon (GripVertical), editable section title, collapse toggle (ChevronDown/Up), delete button (Trash2)
- Collapsible body: expanded by default, toggles on header click (outside drag handle and buttons)
- Delete confirmation: inline "Are you sure?" prompt or window.confirm
- Routes to the correct sub-editor based on `section.type`:
  - `'summary'` -> SummaryEditor
  - `'experience'` -> ExperienceEditor
  - `'education'` -> EducationEditor
  - `'skills'` -> SkillsEditor
  - `'custom'` -> placeholder (future phase)

### 4.9 SectionList

**File:** `src/components/editor/SectionList.tsx`

| Prop | Type | Description |
|------|------|-------------|
| `sections` | `ResumeSection[]` | All resume sections |

**DnD setup:**
- `DndContext` from `@dnd-kit/core` with `closestCenter` collision detection
- `SortableContext` with `verticalListSortingStrategy`
- Each section wrapped in a sortable item using `useSortable`
- On `DragEnd`: compute new order, dispatch `REORDER_SECTIONS`
- `DragOverlay` with a semi-transparent clone for visual feedback
- Uses `PointerSensor` with activation constraint (distance: 8px)

### 4.10 ResumeEditor

**File:** `src/components/editor/ResumeEditor.tsx`

**Structure:**
1. PersonalInfoForm at the top
2. Visual separator
3. SectionList with all sections
4. "Add Section" button at the bottom

**Add Section behavior:**
- Button shows a dropdown/popover with available section types
- Available types: Summary, Experience, Education, Skills, Custom
- Types already present (except Custom) are disabled/hidden
- Clicking a type dispatches `ADD_SECTION` with the type and a default title
- Default titles: "Professional Summary", "Work Experience", "Education", "Skills", "Custom Section"

---

## 5. Styling Conventions

### 5.1 Form Inputs

```
- Border: border border-surface-200
- Rounded: rounded-lg
- Padding: px-3 py-2
- Focus: focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
- Font: text-sm text-surface-900
- Label: text-sm font-medium text-surface-700 mb-1.5
- Background: bg-white
```

### 5.2 Section Cards

```
- Border: border border-surface-200
- Rounded: rounded-xl
- Background: bg-white
- Shadow: shadow-sm (default), shadow-md (dragging)
- Opacity: opacity-50 (dragging source)
```

### 5.3 Buttons

```
Primary: bg-primary-600 text-white hover:bg-primary-700 rounded-lg px-4 py-2
Secondary: border border-surface-200 text-surface-700 hover:bg-surface-50 rounded-lg px-3 py-2
Destructive: text-red-500 hover:text-red-700 hover:bg-red-50
Icon: p-1.5 rounded-md text-surface-400 hover:text-surface-600 hover:bg-surface-100
```

### 5.4 Tags (Skills)

```
- Background: bg-surface-100
- Text: text-surface-700 text-sm
- Rounded: rounded-full
- Padding: px-3 py-1
- Remove button: ml-1.5, text-surface-400 hover:text-surface-600
```

---

## 6. State Flow Diagram

```
PersonalInfoForm
  onChange -> dispatch(SET_PERSONAL_INFO, { field: value })

SummaryEditor
  TiptapEditor.onUpdate -> dispatch(UPDATE_ENTRY, { sectionId, entryId, updates: { content } })

ExperienceEditor
  input.onChange -> dispatch(UPDATE_ENTRY, { sectionId, entryId, updates: { field: value } })
  "Add" -> dispatch(ADD_ENTRY, { sectionId, entry: blankExperienceEntry })
  "Delete" -> dispatch(REMOVE_ENTRY, { sectionId, entryId })
  DnD end -> dispatch(REORDER_ENTRIES, { sectionId, entryIds })

EducationEditor
  (same pattern as ExperienceEditor)

SkillsEditor
  any change -> dispatch(UPDATE_ENTRY, { sectionId, entryId, updates: { categories: [...] } })

SectionList
  DnD end -> dispatch(REORDER_SECTIONS, { sectionIds })

SectionEditor
  "Delete section" -> dispatch(REMOVE_SECTION, { sectionId })
  Title edit -> dispatch(UPDATE_SECTION, { sectionId, updates: { title } })

ResumeEditor
  "Add section" -> dispatch(ADD_SECTION, { type, title })
```

---

## 7. Verification Checklist

- [ ] Personal info form updates state and reflects changes
- [ ] Tiptap editor renders with toolbar, supports bold/italic/underline/lists/links
- [ ] Summary section editable via Tiptap
- [ ] Experience entries: add, edit all fields, delete, reorder via DnD
- [ ] Education entries: add, edit all fields, delete, reorder via DnD
- [ ] Skills: add/remove categories, add/remove skills (tag input), edit category names
- [ ] Sections: collapsible, deletable (with confirmation), drag-and-drop reorderable
- [ ] "Add Section" button shows available types, dispatches correctly
- [ ] All changes persist to localStorage via auto-save
- [ ] `npm run build` completes without errors
- [ ] UI is polished: consistent spacing, form styling, visual hierarchy

---

*End of Phase 2 spec.*
