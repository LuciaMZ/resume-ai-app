# Phase 3: Template & Preview - Implementation Spec

**Phase:** 3 of 6
**Status:** In Progress
**Date:** 2026-03-06
**Depends on:** Phase 1 (Foundation) - COMPLETE, Phase 2 (Editor) - COMPLETE

---

## 1. Overview

Phase 3 introduces the template rendering system and live preview panel. The main deliverables are: (1) a template registry with helper functions, (2) the "Classic" production-quality template, (3) a preview panel that renders the template at A4 scale and fits it to the panel, (4) preview controls for template selection, and (5) updates to the main page layout to replace the placeholder preview with the real component. After Phase 3 the user can edit their resume on the left and see a live, production-quality rendered preview on the right.

---

## 2. File Structure

```
src/components/
  templates/
    registry.ts                -- Central template registry + helpers
    classic/
      ClassicTemplate.tsx      -- Production-quality classic resume template
  preview/
    ResumePreview.tsx           -- Preview container (scaled A4 rendering)
    PreviewControls.tsx         -- Template selector + export PDF placeholder
```

---

## 3. Component Contracts

### 3.1 Template Registry (`src/components/templates/registry.ts`)

**Exports:**

| Export | Type | Description |
|--------|------|-------------|
| `templateRegistry` | `TemplateRegistry` | Map of template IDs to `TemplateDefinition` objects |
| `getTemplate(id)` | `(id: string) => TemplateDefinition \| undefined` | Lookup a single template by ID |
| `getAllTemplates()` | `() => TemplateDefinition[]` | Get all registered templates as an array |

**Initial registry contents:**

| ID | Name | Description | Component |
|----|------|-------------|-----------|
| `classic` | Classic | Clean, single-column professional layout | `ClassicTemplate` |

### 3.2 ClassicTemplate (`src/components/templates/classic/ClassicTemplate.tsx`)

**Props:** Implements `TemplateProps` from `src/types/template.ts`

| Prop | Type | Description |
|------|------|-------------|
| `data` | `ResumeData` | Complete resume data |
| `accentColor?` | `string` | Hex color for accent elements. Default: `#2563eb` (primary-600) |

**Rendering Contract:**

The template renders sections in `data.sections` order, filtering by `section.visible === true`. Each section type renders differently:

| Section Type | Rendering |
|-------------|-----------|
| `summary` | Section title + HTML content paragraph |
| `experience` | Section title + entries, each with: job title (bold), company / location / dates (secondary), description (HTML) |
| `education` | Section title + entries, each with: degree + field (bold), institution / dates (secondary), optional description (HTML) |
| `skills` | Section title + entries, each showing categories with name (bold) followed by comma-separated skills |
| `custom` | Section title + entries, each with: optional title (bold), optional subtitle / dates (secondary), description (HTML) |

**Design Specifications:**

| Element | Style |
|---------|-------|
| Page container | 8.5in x 11in (US Letter), white background, ~0.6in padding on sides, ~0.5in padding top/bottom |
| Full name | 24px, font-weight 700, accent color, centered |
| Contact row | 13px, centered, pipe-separated, surface-600 color |
| Section title | 15px, font-weight 700, uppercase, accent color, bottom border (1px accent) |
| Job title / Degree | 14px, font-weight 600, surface-900 |
| Company / Institution | 14px, font-weight 400, surface-700 |
| Dates | 13px, surface-500, right-aligned on the same line as title |
| Body text / HTML | 13px, surface-700, line-height 1.5 |
| Skill category name | 13px, font-weight 600, surface-800 |
| Skill items | 13px, surface-700, comma-separated |

**Edge Cases:**
- Empty `firstName`/`lastName`: render nothing for header
- No visible sections: render only the header
- Empty entries: skip entries with no meaningful content
- Long content: natural page overflow (template does not paginate -- that's Phase 4)
- Missing optional fields (location, field, website, etc.): omit gracefully, no dangling separators

**HTML Content Rendering:**
- Use `dangerouslySetInnerHTML` for Tiptap HTML fields (`content`, `description`)
- Apply the `.template-content` CSS class to HTML containers for consistent list/link/text styling

**Date Formatting:**
- Use `date-fns` `format` / `parse` to convert `"YYYY-MM"` to `"MMM yyyy"` (e.g., "Jun 2021")
- `null` endDate renders as `"Present"`
- Empty string dates: omit the date range entirely

### 3.3 ResumePreview (`src/components/preview/ResumePreview.tsx`)

**Props:** None (reads from `useResumeData()` context)

**Behavior:**
1. Reads `state` from `useResumeData()`
2. Gets `templateId` from `state.meta.templateId`
3. Gets `accentColor` from `state.meta.accentColor`
4. Looks up the template component via `getTemplate(templateId)`
5. Falls back to `classic` if template ID is not found
6. Renders the template inside a scaled container

**Scaling Strategy:**
- The template renders at full print size inside an element with fixed dimensions (816px x 1056px for US Letter at 96dpi)
- The container measures its own width and calculates `scale = containerWidth / 816`
- Uses CSS `transform: scale(scale)` with `transform-origin: top center`
- The outer wrapper sets its height to `actualHeight * scale` to avoid layout overflow
- Uses a `ResizeObserver` to recalculate scale when the panel resizes

**Visual Treatment:**
- Paper background: white with subtle box-shadow
- Surrounding area: surface-100 (the panel background)
- The paper element should look like a floating page

### 3.4 PreviewControls (`src/components/preview/PreviewControls.tsx`)

**Props:** None (reads from `useResumeData()` context)

**UI Elements:**

| Element | Type | Behavior |
|---------|------|----------|
| Template selector | `<select>` dropdown | Lists all templates from `getAllTemplates()`. Selected value = `state.meta.templateId`. On change, dispatches `SET_TEMPLATE`. |
| Export PDF button | Button | Placeholder (disabled or shows tooltip "Coming in Phase 4"). Uses `Download` icon from lucide-react. |
| Zoom controls (optional) | Two buttons (+ / -) | Adjust a local zoom multiplier applied on top of the auto-fit scale. Not required for MVP. |

**Layout:** Horizontal bar above the preview, with controls right-aligned. Height ~48px with bottom border.

### 3.5 Main Page Updates (`src/app/page.tsx`)

**Changes:**
- Import `ResumePreview` and `PreviewControls`
- Replace the placeholder preview `<section>` content with:
  - `PreviewControls` at the top of the preview section
  - `ResumePreview` filling the remaining space (scrollable)
- Keep the editor panel as-is
- Adjust the header: move the template selector button out (it's now in PreviewControls). Keep Settings and Export PDF in header.

**Layout widths remain unchanged:**
- Editor: `flex-1 lg:max-w-[50%]`
- Preview: `flex-1` (fills remaining space)
- Below `lg` (1024px): editor only shown, preview hidden (toggle already exists)

---

## 4. CSS Requirements

### 4.1 Template Content Styles (globals.css)

Add a `.template-content` class for HTML content rendered inside templates. This ensures Tiptap-generated HTML (lists, bold, links, etc.) renders correctly in the template context.

```css
.template-content p { margin: 0.15em 0; }
.template-content ul, .template-content ol { padding-left: 1.4em; margin: 0.15em 0; }
.template-content ul { list-style-type: disc; }
.template-content ol { list-style-type: decimal; }
.template-content li { margin: 0.1em 0; }
.template-content li p { margin: 0; }
.template-content strong { font-weight: 600; }
.template-content em { font-style: italic; }
.template-content u { text-decoration: underline; }
.template-content a { color: inherit; text-decoration: underline; }
```

### 4.2 Print Styles (globals.css)

```css
@media print {
  body > * { display: none !important; }
  #resume-print-target { display: block !important; }
  @page { size: letter; margin: 0; }
}
```

These rules will be finalized in Phase 4 (PDF Export) but the foundation is laid here.

---

## 5. Data Flow

```
ResumeProvider (state)
  |
  +-> ResumeEditor (reads & writes state)
  |
  +-> PreviewControls (reads meta.templateId, dispatches SET_TEMPLATE)
  |
  +-> ResumePreview
        |
        +-> getTemplate(state.meta.templateId) -> TemplateDefinition
        |
        +-> <TemplateComponent data={state} accentColor={state.meta.accentColor} />
```

Templates are pure renderers -- they receive `ResumeData` as props and produce HTML. They have zero knowledge of state management, editing, or persistence.

---

## 6. Verification Criteria

| # | Criterion | How to Verify |
|---|-----------|---------------|
| 1 | Classic template renders all section types | Load default data, verify summary, experience, education, skills all appear |
| 2 | Template respects section ordering | Reorder sections in editor, verify preview updates order |
| 3 | Template respects section visibility | Toggle section visibility in editor, verify it hides/shows in preview |
| 4 | Live preview updates in real-time | Edit a field in the editor, verify preview updates immediately |
| 5 | Preview scales to fit panel | Resize the browser, verify the preview paper scales proportionally |
| 6 | Template selector changes template | Select a different template (future), verify preview re-renders. With only Classic, verify dropdown shows Classic selected. |
| 7 | Tiptap HTML renders correctly | Add bold, lists, links in editor, verify they appear correctly in template |
| 8 | Empty/missing fields handled | Clear fields, verify no broken layout, no dangling separators |
| 9 | Date formatting correct | Verify "2021-06" renders as "Jun 2021", null endDate renders as "Present" |
| 10 | Page proportions correct | Preview should visually match US Letter proportions (8.5 x 11 ratio) |

---

*End of spec.*
