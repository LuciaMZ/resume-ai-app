# AGENTS.md

This file provides guidance to Claude Code when working in this repository.

---

## Commands

```bash
pnpm dev                                              # Dev server → localhost:3000
pnpm build                                            # Production build
pnpm lint                                             # ESLint
pnpm test                                             # All tests (vitest)
pnpm test:watch                                       # Watch mode
npx vitest run src/__tests__/lib/ai.test.ts           # Single test file
```

No `.env` file is required for local dev. The AI key is entered at runtime by the user and stored in localStorage — it is never baked into a build.

---

## Architecture

**Resume AI APP v2** is a fully client-side resume builder. No backend.  
Stack: Next.js 16 · React 19 · Tailwind CSS 4 · TypeScript  
All persistent state lives in `localStorage` (keys prefixed `resume-ai-app:`).

### Routes

| Route | Purpose |
|---|---|
| `/` | Landing page — static, no providers |
| `/builder` | Main resume builder — wrapped in providers via `builder/layout.tsx` |

---

## State Management

Four context providers wrap the builder (`src/app/builder/layout.tsx`):

```
<ResumeProvider>          ← core resume data + dispatch
  <AIProvider>            ← OpenAI key + model selection
    <ActiveSectionProvider>  ← which editor section has focus (drives AI panel)
      <ToastProvider>     ← notification queue
```

Access via hooks — all throw if used outside their provider:

| Hook | Source | What it gives you |
|---|---|---|
| `useResumeData()` | `ResumeProvider` | `{ state, dispatch }` |
| `useAIConfig()` | `AIProvider` | `{ apiKey, model, isAIEnabled }` |
| `useActiveSection()` | `ActiveSectionProvider` | `{ activeSection, setActiveSection }` |
| `useToast()` | `ToastProvider` | `{ addToast }` |

### ResumeProvider — Action Reference

`src/providers/ResumeProvider.tsx` — `useReducer` with the following actions:

```
SET_PERSONAL_INFO
ADD_SECTION / REMOVE_SECTION / UPDATE_SECTION / REORDER_SECTIONS
ADD_ENTRY / UPDATE_ENTRY / REMOVE_ENTRY / REORDER_ENTRIES
APPLY_SUGGESTION       ← accepts a patch object; AI-generated changes go through here
SET_TEMPLATE
LOAD_RESUME
RESET_RESUME
```

Every mutation passes through `withUpdatedTimestamp()`, which stamps `meta.updatedAt`.

> **On `APPLY_SUGGESTION`**: AI reads from `ResumeData` but never writes to it directly. When a user accepts an AI suggestion, `APPLY_SUGGESTION` dispatches a typed patch to the reducer — keeping the AI read-only in logic while removing manual copy-paste friction.

---

## Data Flow

```
Editor components
  → dispatch(action)
    → ResumeProvider reducer
      → state update
        → useAutoSave (500ms debounce) → localStorage
        → ResumePreview (150ms debounce, scaled to container)
        → PrintTarget (hidden offscreen, 1:1 scale for PDF)
```

### Autosave behavior

- Saves are debounced — do not assume the last action is persisted immediately.
- **No error recovery on failed saves.** If `localStorage.setItem` throws (quota exceeded, private browsing restrictions), the error is currently swallowed. Do not add silent error swallowing elsewhere; surface it via `useToast()`.
- **No cross-device sync.** Data is local only. The explicit escape hatch is JSON export/import (File menu in the builder). Do not build features that assume persistence beyond the current browser.

### PDF Export

`usePDFExport` targets `#resume-print-target` via `react-to-print`. Print CSS in `globals.css` hides all UI chrome. The print target uses `position: absolute; left: -9999px` — **not** `display: none` — because browsers will not print hidden elements. Do not change this.

Page size is US Letter: 816 × 1056 px (8.5 in × 11 in at 96 dpi).

---

## AI Integration

`lib/ai.ts` — `generateSuggestions()` calls the OpenAI Chat Completions API directly from the browser using the user-supplied key.

**Known tradeoff**: Calling OpenAI from the browser exposes the API key in network tabs. This is a deliberate product decision (no backend, no key proxy). Do not add a server route to proxy this unless the architecture decision is revisited explicitly.

### Response parsing

OpenAI has shipped multiple response shapes over time. All format normalization lives in one place:

```
lib/ai.ts → parseAIResponse(raw: unknown): string
```

This function handles:
- Legacy: `choices[0].message.content`
- Newer: `output_text`
- Newer alt: `output[0].content[0].text`

It strips markdown code fences before JSON parsing.

**Rule**: If OpenAI changes their response format again, update `parseAIResponse` and its tests — do not add another branch in `generateSuggestions`.

---

## Template System

Templates are pure renderers. They receive props and return markup — zero knowledge of editing, state, or providers.

```ts
interface TemplateProps {
  data: ResumeData;
  accentColor?: string;  // sourced from ResumeData.meta.accentColor
}
```

Accent color is persisted in `ResumeData.meta` as part of the resume document, not in settings.

Three templates ship today:

| Name | Layout |
|---|---|
| `Classic` | Single-column |
| `Modern` | Two-column sidebar |
| `Academic` | Serif scholarly CV |

Shared utilities: `components/templates/shared/template-utils.ts`  
(`formatDate`, `formatDateRange`, `buildFullName`, `getVisibleSections`, `isEmptyHTML`)

> **Rule**: `template-utils.ts` is shared infrastructure — generic, template-agnostic utilities only. Template-specific formatting logic belongs inside the template component itself, not in shared utils.

### Adding a template

1. Create `components/templates/{name}/{Name}Template.tsx`
2. Implement `TemplateProps`
3. Import only from `../shared/template-utils` for shared helpers
4. Register in `components/templates/registry.ts`
5. Add a snapshot test with fixture data (see Testing section)

### Adding a section type

Touches multiple layers — complete all of them:

- [ ] `types/resume.ts` — extend the `SectionType` discriminated union
- [ ] `providers/ResumeProvider.tsx` — handle new type in reducer (ADD/UPDATE/REMOVE/REORDER)
- [ ] `components/editor/` — add editor UI for the new section
- [ ] All three templates — render the new section type
- [ ] `template-utils.ts` — add to `getVisibleSections` if applicable
- [ ] Tests — reducer unit tests + at least one template snapshot

---

## Data Model

Defined in `types/resume.ts`.

```
ResumeData
  meta           { id, createdAt, updatedAt, template, accentColor }
  personalInfo   { name, email, phone, location, website, linkedin, ... }
  sections[]     Section (discriminated union on `type`)
```

**Section types**: `summary | experience | education | skills | custom`

Entries within sections are typed per section. Rich text fields store Tiptap HTML strings. Dates use `"YYYY-MM"` format; `null` endDate means "Present".

---

## Storage

```
resumeAIapp:resume      → serialized ResumeData
resumeAIapp:ai-config   → { apiKey, model }
resumeAIapp:settings    → UI preferences (template, colors, etc.)
```

All read/write goes through `lib/storage.ts`. Do not call `localStorage` directly elsewhere.

---

## Testing

Tests live in `src/__tests__/` mirroring source structure.  
Stack: Vitest · jsdom · React Testing Library  
Setup: `src/__tests__/setup.ts` — mocks `localStorage` globally.

### What to test where

| Layer | Approach |
|---|---|
| `resumeReducer` | Pure unit tests — import and call the reducer directly. Do **not** use `renderHook` for pure logic. |
| Provider integration | `renderHook` with provider wrapper — for testing hook behavior and side effects. |
| `parseAIResponse` | Unit tests covering all three OpenAI response shapes + malformed input. |
| Template components | Snapshot tests with `resumeFixture` data — one per template. Catches PDF regressions. |
| Editor components | RTL render tests for user interactions (add entry, remove entry, reorder). |

### Running a focused test

```bash
npx vitest run src/__tests__/lib/ai.test.ts
npx vitest run src/__tests__/providers/ResumeProvider.test.ts
```

---

## Key Invariants

These are load-bearing decisions. Change them only with a clear reason and updated docs:

1. **AI never writes to state directly** — all AI-sourced mutations go through `APPLY_SUGGESTION`.
2. **No backend** — OpenAI is called from the browser. No server routes.
3. **PrintTarget is offscreen, not hidden** — `position: absolute; left: -9999px`, never `display: none`.
4. **All localStorage access through `lib/storage.ts`** — never call `localStorage` directly.
5. **`template-utils.ts` is generic only** — no template-specific logic.
6. **`parseAIResponse` is the single format normalization point** — all OpenAI response shapes handled there.