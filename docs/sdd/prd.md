# PRD: Resume AI APP v2

**Version:** 1.0
**Date:** 2026-03-06
**Status:** Draft
**Author:** Product & Engineering

---

## 1. Overview

### 1.1 Problem Statement

Building a professional resume is a frustrating experience for most job seekers. Existing tools fall into two camps: (1) AI-first products that gate core functionality behind paid APIs or subscriptions, and (2) free builders with rigid templates and poor editing experiences. There is a gap for a polished, fully-functional resume builder that treats AI as an optional enhancement rather than a prerequisite -- allowing users to get value immediately while optionally unlocking AI-powered suggestions when they bring their own API key.

### 1.2 Proposed Solution

Resume AI APP v2 is a Next.js-based web application that provides a beautiful, WYSIWYG resume editing experience powered by Tiptap. Users build their resume in a structured yet flexible editor, preview it in real-time through a template rendering system, and export the final result as PDF. The application stores data locally in the browser (localStorage) with no authentication required, minimizing friction to zero.

When a user configures an OpenAI API key, a non-intrusive AI suggestions panel appears on the right side of the editor. This panel provides contextual recommendations (e.g., improving bullet points, suggesting action verbs, refining summaries) with one-click copy-to-clipboard. Critically, removing the API key does not degrade the core experience -- every feature except AI suggestions works without it.

The architecture is designed for extensibility: the template system uses a pluggable component interface, allowing new resume templates to be added by implementing a well-defined contract against a template-agnostic data model.

### 1.3 Target Users

| Persona | Description | Primary Need |
|---------|-------------|--------------|
| **Active Job Seeker** | Currently applying to jobs, needs to iterate on resume quickly | Fast editing, PDF export, professional templates |
| **Career Changer** | Pivoting industries, unsure how to frame past experience | AI suggestions for reframing bullet points |
| **Developer / Power User** | Comfortable with API keys, wants AI enhancement | AI-assisted writing without a subscription |
| **Casual Updater** | Employed but keeping resume current | Quick edits, auto-save, no account friction |

---

## 2. Goals & Success Metrics

### 2.1 Primary Goals

1. **Zero-friction resume creation** -- A user should be able to start editing a resume within 5 seconds of landing on the page (no sign-up, no onboarding wall).
2. **Production-quality PDF output** -- Exported PDFs must be visually identical to the in-app preview, with proper typography, spacing, and layout.
3. **Extensible template architecture** -- Adding a new template should require creating a single component file that implements a defined interface, with no changes to core application code.
4. **Optional AI that adds real value** -- When enabled, AI suggestions should measurably improve resume content quality (stronger action verbs, better quantification, ATS-friendly phrasing).

### 2.2 Key Metrics / KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to first edit | < 5 seconds | From page load to first keystroke |
| PDF export success rate | 100% | No failed/corrupt exports |
| Template addition effort | < 1 hour | Time for a developer to add a new template |
| AI suggestion acceptance rate | > 40% | Suggestions copied to clipboard / total shown |
| Auto-save reliability | 100% | No data loss on page refresh |

### 2.3 Non-Goals (Explicitly Out of Scope for MVP)

- User authentication or account management
- Server-side data persistence (database)
- Multi-resume management (only one resume at a time)
- Template marketplace or community sharing
- Collaborative editing
- Resume scoring or ATS compatibility analysis
- Mobile-optimized editing experience (responsive viewing is fine, but editing is desktop-focused)
- Cover letter generation
- Import from LinkedIn or existing resume files

---

## 3. User Stories & Requirements

### 3.1 User Stories

#### Core Resume Building

| ID | Story | Priority |
|----|-------|----------|
| US-01 | As a job seeker, I want to fill in my personal information (name, email, phone, location, links) so that my resume has correct contact details. | Must-have |
| US-02 | As a job seeker, I want to write a professional summary using a rich text editor so that I can format it with bold, italic, and lists. | Must-have |
| US-03 | As a job seeker, I want to add multiple work experience entries with job title, company, dates, and description so that I can showcase my career history. | Must-have |
| US-04 | As a job seeker, I want to add education entries with institution, degree, dates, and details so that I can show my academic background. | Must-have |
| US-05 | As a job seeker, I want to add a skills section with categorized skills so that employers can quickly assess my capabilities. | Must-have |
| US-06 | As a job seeker, I want to reorder sections and entries via drag-and-drop so that I can prioritize what matters most for each application. | Must-have |
| US-06b | As a job seeker, I want to add and remove resume sections so that I can customize which sections appear on my resume. | Must-have |
| US-07 | As a job seeker, I want to add custom sections (certifications, projects, volunteer work, etc.) so that I can include non-standard content. | Should-have |

#### Template & Preview

| ID | Story | Priority |
|----|-------|----------|
| US-08 | As a user, I want to see a real-time preview of my resume as I type so that I can see exactly what the final output looks like. | Must-have |
| US-09 | As a user, I want to select from available templates so that I can choose the visual style that fits my industry. | Must-have (architecture), Nice-to-have (multiple templates in MVP) |
| US-10 | As a user, I want the template to render my data consistently regardless of which template I choose so that switching templates doesn't lose content. | Must-have |

#### Persistence & Export

| ID | Story | Priority |
|----|-------|----------|
| US-11 | As a user, I want my resume to auto-save to my browser so that I never lose my work. | Must-have |
| US-12 | As a user, I want to export my resume as a PDF so that I can submit it to job applications. | Must-have |
| US-13 | As a user, I want the PDF to look identical to the preview so that there are no surprises. | Must-have |

#### AI Suggestions

| ID | Story | Priority |
|----|-------|----------|
| US-14 | As a user, I want to enter my OpenAI API key in a settings area so that I can enable AI features. | Must-have |
| US-15 | As a user, I want to see AI-generated suggestions for improving my resume content in a side panel so that I can write more effectively. | Must-have |
| US-16 | As a user, I want to copy any AI suggestion to my clipboard with one click so that I can paste it into my resume. | Must-have |
| US-17 | As a user without an API key, I want the app to work perfectly without any AI-related UI clutter so that I have a clean editing experience. | Must-have |
| US-18 | As a user, I want AI suggestions to be contextual to the section I'm currently editing so that they are relevant and actionable. | Should-have |

### 3.2 Functional Requirements

#### Must-Have (MVP)

| ID | Requirement | Details |
|----|------------|---------|
| FR-01 | **Personal Info Form** | Structured input fields for name, email, phone, location, website/LinkedIn URL. Not Tiptap -- standard form inputs. |
| FR-02 | **Resume Sections** | Support for: Summary, Experience, Education, Skills. Each section is editable, can be added/removed, and reordered via drag-and-drop. |
| FR-03 | **Tiptap Rich Text Editor** | WYSIWYG editing for free-text fields (summary, experience descriptions, education details). Toolbar with: bold, italic, underline, bullet list, ordered list, link. |
| FR-04 | **Real-Time Preview** | Live-updating preview panel showing the resume as it will appear in the PDF. Updates on every keystroke (debounced). |
| FR-05 | **Template Rendering** | At least 1 production-quality template. Template receives a standardized `ResumeData` object and renders it. Template component follows a defined `TemplateProps` interface. |
| FR-06 | **Template Registry** | Central registry where templates are registered. Adding a template = creating a component + adding an entry to the registry. No core code changes needed. |
| FR-07 | **PDF Export** | Generate a PDF from the rendered resume. PDF must accurately reproduce the template layout, fonts, colors, and spacing. |
| FR-08 | **LocalStorage Auto-Save** | Resume data is serialized to JSON and saved to localStorage on every change (debounced, ~500ms). On page load, data is restored from localStorage. |
| FR-09 | **API Key Management** | Settings area (modal or settings page) where user can enter/remove their OpenAI API key. Key stored in localStorage (encrypted if feasible). |
| FR-10 | **AI Suggestions Panel** | Right-side panel that appears only when API key is configured. Shows AI-generated suggestions for the currently focused section. Each suggestion has a copy-to-clipboard button. |
| FR-11 | **Graceful AI Degradation** | If no API key is set, the AI panel is completely hidden. No error states, no "upgrade" prompts -- just a clean editor. |

| FR-12 | **Section Drag-and-Drop Reordering** | Drag-and-drop to reorder resume sections (e.g., move Education above Experience) using `@dnd-kit/core`. | Must-have |
| FR-13 | **Entry Drag-and-Drop Reordering** | Drag-and-drop to reorder entries within a section (e.g., reorder work experiences) using `@dnd-kit/core`. | Must-have |
| FR-12b | **Section Add/Remove** | Users can add new sections from a predefined list and remove existing sections with a confirmation prompt. Removing a section deletes its data. | Must-have |

#### Should-Have

| ID | Requirement | Details |
|----|------------|---------|
| FR-14 | **Custom Sections** | Ability to add user-defined sections with a title and rich text content. |
| FR-15 | **Date Picker** | Structured date input for experience and education entries (month/year format with "Present" option). |
| FR-16 | **Contextual AI Prompts** | AI suggestions change based on which section/field the user is currently editing. |

#### Nice-to-Have

| ID | Requirement | Details |
|----|------------|---------|
| FR-17 | **Multiple Templates** | 2-3 additional templates beyond the MVP default. |
| FR-18 | **Template Color Customization** | Allow users to adjust the accent color of a template. |
| FR-19 | **Print Stylesheet** | `Ctrl+P` produces a well-formatted printout even without using the PDF export button. |
| FR-20 | **Resume Reset** | "Start Over" button that clears all data with a confirmation dialog. |
| FR-21 | **Undo/Redo** | Global undo/redo beyond what Tiptap provides natively (for structural changes like section deletion). |

### 3.3 Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Initial page load under 2 seconds (LCP). Preview updates within 100ms of input. PDF generation under 5 seconds. |
| **Accessibility** | WCAG 2.1 AA compliance for the editor interface. Keyboard-navigable form inputs. Proper ARIA labels on all interactive elements. Sufficient color contrast (4.5:1 minimum). |
| **Browser Support** | Chrome (latest 2), Firefox (latest 2), Safari (latest 2), Edge (latest 2). |
| **Data Safety** | No resume data ever leaves the browser except for AI API calls (which send only the text of the section being analyzed, not the full resume). API keys stored in localStorage with base64 encoding at minimum. |
| **Responsiveness** | Preview is viewable on tablet. Editor is optimized for screens >= 1024px wide. Below 1024px, editor and preview stack vertically. |
| **SEO** | Not a priority (single-page app experience). Basic meta tags for discoverability. |

---

## 4. Data Model

### 4.1 Core Resume Data Schema

The resume data model is the contract between the editor and templates. It must be template-agnostic -- any template can render any valid `ResumeData` object.

```typescript
// types/resume.ts

interface ResumeData {
  meta: ResumeMeta;
  personalInfo: PersonalInfo;
  sections: ResumeSection[];
}

interface ResumeMeta {
  id: string;                    // UUID, generated on first create
  templateId: string;            // References the selected template
  accentColor?: string;          // Optional template accent color
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
  schemaVersion: number;         // For future migrations (start at 1)
}

interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;              // City, State/Country
  website?: string;
  linkedIn?: string;
  github?: string;
  customLinks?: { label: string; url: string }[];
}

interface ResumeSection {
  id: string;                    // UUID
  type: SectionType;
  title: string;                 // Display title (editable by user)
  visible: boolean;              // Toggle section visibility
  order: number;                 // Sort order
  entries: SectionEntry[];
}

type SectionType =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'custom';

// Discriminated union for different entry types
type SectionEntry =
  | SummaryEntry
  | ExperienceEntry
  | EducationEntry
  | SkillsEntry
  | CustomEntry;

interface SummaryEntry {
  id: string;
  type: 'summary';
  content: string;               // Tiptap HTML string
}

interface ExperienceEntry {
  id: string;
  type: 'experience';
  jobTitle: string;
  company: string;
  location?: string;
  startDate: string;             // "YYYY-MM" format
  endDate: string | null;        // null = "Present"
  description: string;           // Tiptap HTML string
}

interface EducationEntry {
  id: string;
  type: 'education';
  institution: string;
  degree: string;
  field?: string;                // Field of study
  startDate: string;
  endDate: string | null;
  description?: string;          // Tiptap HTML string (optional details)
}

interface SkillsEntry {
  id: string;
  type: 'skills';
  categories: SkillCategory[];
}

interface SkillCategory {
  id: string;
  name: string;                  // e.g., "Programming Languages"
  skills: string[];              // e.g., ["TypeScript", "Python", "Go"]
}

interface CustomEntry {
  id: string;
  type: 'custom';
  title?: string;                // Optional sub-heading
  subtitle?: string;
  startDate?: string;
  endDate?: string | null;
  description: string;           // Tiptap HTML string
}
```

### 4.2 Template Interface

```typescript
// types/template.ts

interface TemplateDefinition {
  id: string;                    // Unique template identifier
  name: string;                  // Display name
  description: string;           // Brief description for template picker
  thumbnail: string;             // Path to preview image
  component: React.ComponentType<TemplateProps>;
}

interface TemplateProps {
  data: ResumeData;
  accentColor?: string;
}

// Template registry type
type TemplateRegistry = Record<string, TemplateDefinition>;
```

### 4.3 AI Suggestion Model

```typescript
// types/ai.ts

interface AISuggestion {
  id: string;
  sectionId: string;             // Which section this suggestion is for
  sectionType: SectionType;
  originalText: string;          // The text that was analyzed
  suggestion: string;            // The AI-generated improvement
  category: SuggestionCategory;
  timestamp: string;
}

type SuggestionCategory =
  | 'rewrite'                    // Full rewrite of the text
  | 'action-verb'                // Stronger action verb suggestion
  | 'quantify'                   // Add metrics/numbers
  | 'ats-optimize'               // ATS-friendly phrasing
  | 'concise';                   // Shorten/tighten

interface AIConfig {
  apiKey: string;
  model?: string;                // Default: 'gpt-4o-mini'
}
```

### 4.4 LocalStorage Schema

```typescript
// Storage keys
const STORAGE_KEYS = {
  RESUME_DATA: 'resumeAIapp:resume',       // JSON serialized ResumeData
  AI_CONFIG: 'resumeAIapp:ai-config',      // JSON serialized AIConfig
  APP_SETTINGS: 'resumeAIapp:settings',    // UI preferences (theme, etc.)
} as const;
```

---

## 5. Component Architecture

### 5.1 Architecture Principles

1. **Data flows down, events flow up.** The `ResumeData` state lives in a top-level provider. Editor components dispatch actions to update it. Template components receive it as read-only props.
2. **Templates are dumb renderers.** A template component receives `TemplateProps` and renders HTML/CSS. It has zero knowledge of editing, persistence, or AI.
3. **The editor knows nothing about templates.** Editor components work with `ResumeData` sections and entries. They do not import or reference any template code.
4. **AI is a side-channel.** AI features read from `ResumeData` and produce `AISuggestion` objects. They never write directly to `ResumeData` -- users manually copy/paste.

### 5.2 High-Level Component Tree

```
app/
  layout.tsx                      -- Root layout, providers
  page.tsx                        -- Resume builder (main route)
  globals.css                     -- Tailwind + custom styles

components/
  editor/
    ResumeEditor.tsx              -- Main editor container
    PersonalInfoForm.tsx          -- Structured form for contact info
    SectionEditor.tsx             -- Generic section editor wrapper
    SummaryEditor.tsx             -- Tiptap editor for summary
    ExperienceEditor.tsx          -- Experience entry form + Tiptap
    EducationEditor.tsx           -- Education entry form + Tiptap
    SkillsEditor.tsx              -- Skills category/tag editor
    CustomSectionEditor.tsx       -- Generic custom section editor
    SectionList.tsx               -- Sortable list of sections
    TiptapEditor.tsx              -- Reusable Tiptap editor component
    EditorToolbar.tsx             -- Tiptap formatting toolbar

  preview/
    ResumePreview.tsx             -- Preview container (loads template)
    PreviewControls.tsx           -- Zoom, template selector, export button

  templates/
    registry.ts                   -- Template registry (central map)
    classic/
      ClassicTemplate.tsx         -- MVP default template
      classic.module.css          -- Template-specific styles (if needed)
    [future-template]/
      FutureTemplate.tsx

  ai/
    AIPanel.tsx                   -- Right-side suggestions panel
    AISuggestionCard.tsx          -- Individual suggestion with copy button
    AISettingsModal.tsx           -- API key entry modal
    useAISuggestions.ts           -- Hook for fetching AI suggestions

  shared/
    DatePicker.tsx                -- Month/year date input
    CopyButton.tsx                -- Copy-to-clipboard with feedback
    Modal.tsx                     -- Reusable modal
    Button.tsx                    -- Styled button variants
    EmptyState.tsx                -- Empty state placeholder

providers/
  ResumeProvider.tsx              -- React Context + useReducer for ResumeData
  AIProvider.tsx                  -- AI config context

hooks/
  useResumeData.ts                -- Hook to access resume context
  useLocalStorage.ts              -- Generic localStorage sync hook
  useAutoSave.ts                  -- Debounced auto-save logic
  usePDFExport.ts                 -- PDF generation hook

lib/
  storage.ts                      -- localStorage read/write utilities
  pdf.ts                          -- PDF generation logic
  ai.ts                           -- OpenAI API client
  defaults.ts                     -- Default ResumeData (blank template)
  uuid.ts                         -- UUID generation utility

types/
  resume.ts                       -- ResumeData types
  template.ts                     -- Template types
  ai.ts                           -- AI types
```

### 5.3 Template Plugin Architecture

Adding a new template follows this exact process:

**Step 1:** Create a new directory under `components/templates/`:

```
components/templates/modern/
  ModernTemplate.tsx
  modern.module.css (optional)
```

**Step 2:** Implement the `TemplateProps` interface:

```tsx
// components/templates/modern/ModernTemplate.tsx
import { TemplateProps } from '@/types/template';

export function ModernTemplate({ data, accentColor }: TemplateProps) {
  return (
    <div className="modern-template">
      {/* Render data.personalInfo, data.sections, etc. */}
    </div>
  );
}
```

**Step 3:** Register in the template registry:

```typescript
// components/templates/registry.ts
import { ClassicTemplate } from './classic/ClassicTemplate';
import { ModernTemplate } from './modern/ModernTemplate';

export const templateRegistry: TemplateRegistry = {
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'Clean, traditional resume layout',
    thumbnail: '/templates/classic-thumb.png',
    component: ClassicTemplate,
  },
  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary design with accent colors',
    thumbnail: '/templates/modern-thumb.png',
    component: ModernTemplate,
  },
};
```

No changes to any other file are required.

### 5.4 State Management

Resume state is managed via React Context + `useReducer` for predictable state updates:

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

### 5.5 PDF Export Strategy

PDF generation approach (recommended order of evaluation):

1. **Primary: `react-to-print` or `window.print()` with print stylesheet** -- Render the template component in a hidden, print-optimized container. Use CSS `@media print` and `@page` rules for proper page sizing (US Letter / A4). This approach guarantees visual fidelity since the same React component produces both the preview and the PDF.

2. **Fallback: `html2canvas` + `jsPDF`** -- If print-based approaches have browser inconsistencies, capture the rendered template as a canvas image and embed it in a PDF. Slightly lower quality but more predictable cross-browser.

3. **Alternative: `@react-pdf/renderer`** -- Requires re-implementing templates using `react-pdf` primitives instead of HTML/CSS. Higher quality output but significant duplication of template code. Better suited for future iterations if PDF quality becomes a critical differentiator.

**Recommendation:** Start with approach 1 (print-based) for MVP. It is the simplest and maintains the single-template-component principle. If quality issues arise, evaluate approach 2.

---

## 6. Page Layout & UX

### 6.1 Main Page Layout

The resume builder page uses a multi-panel layout:

```
+-----------------------------------------------------------------------+
|  Header / Top Bar                                                      |
|  [Logo]              [Template Selector]  [Settings]  [Export PDF]     |
+-----------------------------------------------------------------------+
|                    |                        |                          |
|   Editor Panel     |   Preview Panel        |   AI Panel (conditional) |
|   (scrollable)     |   (scrollable, zoom)   |   (scrollable)          |
|                    |                        |                          |
|   - Personal Info  |   [Live Template       |   [AI Suggestions]      |
|   - Summary        |    Preview]            |   - Suggestion 1 [Copy] |
|   - Experience     |                        |   - Suggestion 2 [Copy] |
|   - Education      |                        |   - Suggestion 3 [Copy] |
|   - Skills         |                        |                          |
|   - [+ Add Section]|                        |   [Refresh]             |
|                    |                        |                          |
+-----------------------------------------------------------------------+
```

- **Without AI key:** 2-panel layout (editor | preview), each taking ~50% width.
- **With AI key:** 3-panel layout (editor ~35% | preview ~40% | AI ~25%).
- **Below 1024px:** Panels stack vertically (editor on top, preview below, AI last).

### 6.2 Key User Flows

#### Flow 1: First-Time User (No AI)

1. User lands on the page.
2. A default blank resume is loaded with placeholder sections (Summary, Experience, Education, Skills).
3. User fills in personal info fields at the top of the editor.
4. User clicks into the Summary section and types using the Tiptap editor.
5. The preview panel updates in real-time.
6. User adds experience entries, fills in details.
7. Data auto-saves to localStorage continuously.
8. User clicks "Export PDF" -- a PDF downloads immediately.

#### Flow 2: Enabling AI Suggestions

1. User clicks the Settings icon in the top bar.
2. A modal appears with an API key input field.
3. User pastes their OpenAI API key and clicks Save.
4. The modal closes. The AI panel slides in from the right.
5. User clicks into an experience description.
6. The AI panel shows "Generating suggestions..." with a loading state.
7. 2-4 suggestions appear, each with a [Copy] button.
8. User clicks [Copy] on a suggestion they like.
9. A toast confirms "Copied to clipboard."
10. User pastes the suggestion into the Tiptap editor.

#### Flow 3: Switching Templates

1. User clicks the Template Selector in the top bar.
2. A dropdown/modal shows available templates with thumbnail previews.
3. User selects a different template.
4. The preview panel re-renders with the new template, same data.
5. Template choice is persisted in `meta.templateId`.

### 6.3 UX Design Principles

- **No blank page syndrome.** The default resume should have labeled placeholder sections that guide users on what to fill in. Consider pre-filling with sample content that users overwrite.
- **Progressive disclosure.** Show the most common fields first. Advanced options (custom links, custom sections) are accessible but not prominent.
- **Instant feedback.** Every edit is reflected in the preview within 100ms. Every save is silent (no "saved!" toasts on every keystroke -- only on manual actions or errors).
- **Forgiveness.** Accidental deletions should be recoverable. Confirm before deleting entire sections or resetting the resume.
- **Visual hierarchy in the editor.** Section headers should be clearly distinct from entry content. Use subtle visual separators between sections.

---

## 7. Scope & Milestones

### 7.1 MVP Scope

The MVP includes everything marked **Must-have** in Section 3, specifically:

- Personal info form
- 4 default sections: Summary, Experience, Education, Skills
- Section add/remove + drag-and-drop reordering (`@dnd-kit`)
- Entry drag-and-drop reordering within sections
- Tiptap rich text editing
- Real-time preview with 1 polished template
- Template abstraction architecture (registry, interface)
- PDF export
- LocalStorage auto-save
- AI suggestions panel (conditional on API key)
- Copy-to-clipboard for AI suggestions
- API key management

### 7.2 Milestone Breakdown

#### Phase 1: Foundation (Days 1-3)

| Task | Deliverable |
|------|-------------|
| Project scaffolding | Next.js app with App Router, Tailwind CSS configured |
| Data model implementation | TypeScript types, default resume data, UUID utility |
| State management | ResumeProvider with useReducer, all actions |
| LocalStorage persistence | useAutoSave hook, storage utilities |
| Basic page layout | 2-panel layout shell (editor + preview) |

#### Phase 2: Editor (Days 4-7)

| Task | Deliverable |
|------|-------------|
| Personal info form | Structured form with all fields |
| Tiptap integration | Reusable TiptapEditor component with toolbar |
| Section editors | Summary, Experience, Education, Skills editors |
| Section management | Add/remove sections, toggle visibility |
| Entry management | Add/remove entries within sections |
| Drag-and-drop reordering | `@dnd-kit` integration for section and entry reordering |

#### Phase 3: Template & Preview (Days 8-10)

| Task | Deliverable |
|------|-------------|
| Template architecture | TemplateProps interface, registry, loader |
| Classic template | Production-quality default template |
| Preview panel | Live-updating preview with debounced rendering |
| Template selector UI | Dropdown with template thumbnails |

#### Phase 4: PDF Export (Days 11-12)

| Task | Deliverable |
|------|-------------|
| PDF generation | Print-based or html2canvas approach |
| Export button | Download trigger with loading state |
| Quality validation | PDF matches preview across browsers |

#### Phase 5: AI Integration (Days 13-16)

| Task | Deliverable |
|------|-------------|
| API key management | Settings modal, localStorage storage |
| AI client | OpenAI API integration in lib/ai.ts |
| AI suggestions hook | useAISuggestions with loading/error states |
| AI panel UI | Right-side panel, suggestion cards, copy buttons |
| Layout adaptation | Dynamic 2/3-panel layout based on AI config |

#### Phase 6: Polish (Days 17-20)

| Task | Deliverable |
|------|-------------|
| Visual design polish | Colors, typography, spacing, shadows, transitions |
| Edge cases | Empty states, error handling, long content |
| Responsive layout | Tablet/mobile viewing |
| Cross-browser testing | Chrome, Firefox, Safari, Edge |
| Performance optimization | Bundle size, render performance |

### 7.3 Future Iterations (Post-MVP)

| Iteration | Features |
|-----------|----------|
| **v2.1** | Custom sections, date picker, undo/redo for structural changes |
| **v2.2** | 2-3 additional templates, template color customization |
| **v2.3** | Supabase integration (auth + persistence), multi-resume management |
| **v2.4** | Resume import (paste text / upload PDF), ATS scoring |
| **v2.5** | Template marketplace, community sharing |

---

## 8. Technical Considerations

### 8.1 Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 14+ (App Router) | Modern React framework with excellent DX, SSR/SSG capabilities for future SEO needs |
| Styling | Tailwind CSS | Utility-first, fast iteration, good for building distinctive designs |
| Rich Text | Tiptap (v2) | Headless, extensible, excellent React integration, ProseMirror-based |
| PDF | `react-to-print` (primary) | Simplest approach, reuses template components |
| State | React Context + useReducer | Sufficient for single-page app, no external dependency needed |
| Storage | localStorage | Zero-setup persistence, adequate for single-resume |
| AI | OpenAI API (client-side) | Direct API calls from browser using user's key |
| Drag & Drop | `@dnd-kit/core` + `@dnd-kit/sortable` | Modern, accessible, lightweight — used for section and entry reordering (MVP) |
| Icons | Lucide React | Consistent, beautiful, tree-shakeable |
| Utilities | `uuid`, `date-fns` | Standard utilities for ID generation and date formatting |

### 8.2 Key Technical Decisions

**Client-Side AI Calls:** The OpenAI API is called directly from the browser using the user's API key. This avoids the need for a backend API route but means the API key is visible in network requests. This is acceptable because (a) users provide their own key, (b) there is no server cost to protect, and (c) adding a proxy route is trivial when/if a backend is introduced.

**Tiptap HTML Storage:** Tiptap editor content is stored as HTML strings in the resume data model. While Tiptap's JSON format is richer, HTML is more portable (easier for templates to render, easier to migrate to other systems). Tiptap can import/export HTML natively.

**CSS-Based PDF Generation:** The initial PDF approach uses CSS `@media print` rather than a JavaScript-to-PDF library. This ensures pixel-perfect fidelity with the preview and avoids maintaining two rendering paths. If cross-browser inconsistencies arise, we will evaluate alternatives.

**No Server-Side Rendering for Templates:** Templates render entirely client-side. This simplifies the architecture and avoids hydration issues. The preview and PDF both use the same client-rendered component.

### 8.3 Integration Points

| Integration | Direction | Details |
|-------------|-----------|---------|
| OpenAI API | Outbound (client-side) | `POST /v1/chat/completions` with user's API key. Model: `gpt-4o-mini` (cost-effective). Sends only the text of the section being edited, not the full resume. |
| LocalStorage | Internal | Read on mount, write on change (debounced). Versioned schema for future migrations. |
| Supabase (future) | Outbound | Replace localStorage with Supabase for auth + persistence. Data model should be database-ready (UUIDs, timestamps already included). |

### 8.4 Data Requirements

- **Storage limit awareness:** localStorage has a ~5-10MB limit per origin. A single resume's JSON (including Tiptap HTML) is unlikely to exceed 100KB. Safe for MVP.
- **Schema versioning:** The `schemaVersion` field in `ResumeMeta` enables data migrations when the schema evolves. On load, check the version and run migration functions if needed.
- **No PII on server:** All personal information stays in the browser. AI API calls send only section content (not names, emails, or phone numbers).

---

## 9. Risks & Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| 1 | **PDF rendering inconsistencies across browsers** | Medium | High | Test early with all target browsers. Have `html2canvas + jsPDF` as fallback. Define a clear "reference browser" for pixel-perfect output. |
| 2 | **Tiptap HTML output creates inconsistent styling in templates** | Medium | Medium | Normalize Tiptap output with a consistent base stylesheet applied inside the template. Use a sanitization step before rendering. |
| 3 | **localStorage data loss (browser clear, incognito)** | Medium | High | Show a clear indicator that data is stored locally. Provide an "Export JSON" option for manual backup. Warn users in incognito mode. |
| 4 | **OpenAI API rate limiting or errors** | Low | Low | Implement retry with exponential backoff. Show clear error messages. AI is optional, so failures don't block core functionality. |
| 5 | **API key security concerns** | Low | Medium | Document clearly that the key is stored in the browser and used for client-side calls. Recommend users use a key with limited permissions/budget. |
| 6 | **Template complexity makes new templates hard to build** | Medium | High | Create a comprehensive template development guide. Keep the `TemplateProps` interface simple and well-documented. Build the first template as a reference implementation. |
| 7 | **Tiptap bundle size** | Low | Medium | Only import the extensions actually used (bold, italic, underline, lists, links). Tiptap is tree-shakeable. |
| 8 | **Resume content overflows single page in PDF** | Medium | Medium | For MVP, allow multi-page PDFs. Add a page count indicator in the preview. Future: add a "fit to one page" helper. |

---

## 10. Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | Should the AI panel offer different suggestion types (rewrite, action verbs, quantify) as selectable options, or should it auto-detect the best type? | Product | Open |
| 2 | What is the target page size for PDF export -- US Letter, A4, or user-selectable? | Product | Open (recommend A4 as default with US Letter option) |
| 3 | Should we include sample/demo content in the default resume to prevent blank-page syndrome? | Product/Design | Open (recommend yes, with clear "replace this" placeholder text) |
| 4 | How should we handle very long resumes that span multiple pages in the preview? | Design | Open (recommend scroll with page break indicators) |
| 5 | Should the Tiptap editor support tables (for skills matrices, etc.)? | Product | Open (recommend no for MVP -- adds complexity) |
| 6 | Should we store the OpenAI API key with any form of encryption, or is plain localStorage acceptable given the user provides it themselves? | Engineering | Open (recommend base64 as minimum obscuration) |
| 7 | What specific OpenAI model should be the default -- `gpt-4o-mini` (cheap, fast) or `gpt-4o` (higher quality)? | Product | Open (recommend `gpt-4o-mini` as default with option to change) |

---

## 11. Appendix

### 11.1 Prior Art & Competitive Landscape

| Competitor | Strengths | Weaknesses | Resume AI APP diferentiator|
|-----------|-----------|------------|----------------------|
| **Canva Resume** | Beautiful templates, brand recognition | No AI, limited customization per template, requires account | No account needed, AI suggestions, fully customizable sections |
| **Novoresume** | Polished UX, good templates | Freemium paywall, limited free features | Fully free, BYO API key for AI |
| **Resume.io** | Clean editor, good PDF output | Subscription-based, no AI | Free, no subscription, optional AI |
| **Reactive Resume** | Open source, self-hostable | Complex setup, dated UI | Modern Next.js stack, better DX, simpler architecture |
| **ChatGPT + Manual Formatting** | Powerful AI suggestions | No visual editor, manual PDF formatting | Integrated experience: AI suggestions + visual editing + PDF export |

### 11.2 Default Template Specification (Classic)

The MVP "Classic" template should have these characteristics:

- **Layout:** Single-column, professional
- **Typography:** Clean sans-serif (e.g., Inter or Source Sans Pro from Google Fonts)
- **Color:** Minimal -- dark text on white, with a single accent color for headings and dividers
- **Sections:** Clear visual separation between sections with subtle horizontal rules or spacing
- **Name/Header:** Prominent name, contact info in a compact row below
- **Experience entries:** Job title bold, company and dates in a secondary style, description below
- **Skills:** Grouped by category, rendered as inline tags or comma-separated lists
- **Target:** Suitable for corporate, tech, and general use

### 11.3 AI Prompt Strategy

Example system prompt for generating resume suggestions:

```
You are a professional resume writing assistant. The user is editing
the "{sectionType}" section of their resume. Analyze the provided text
and generate {count} improved versions.

For each suggestion:
- Use strong action verbs
- Quantify achievements where possible
- Use concise, professional language
- Optimize for ATS (Applicant Tracking Systems)
- Keep the same general meaning but improve impact

Respond as a JSON array of objects with "suggestion" and "category" fields.
Categories: "rewrite", "action-verb", "quantify", "ats-optimize", "concise"
```

### 11.4 Future: Supabase Migration Path

The current data model is designed to be Supabase-ready:

- All entities use UUID primary keys
- Timestamps use ISO 8601 format
- The `ResumeData` JSON structure can be stored as a JSONB column
- `schemaVersion` enables data migrations
- Adding Supabase requires: (1) auth provider, (2) replacing localStorage calls with Supabase client calls, (3) sync logic for offline/online states

The migration should be transparent to the template system and AI integration -- only the persistence layer changes.

---

*End of document.*
