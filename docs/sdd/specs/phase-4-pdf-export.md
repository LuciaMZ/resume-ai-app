# Phase 4: PDF Export - Implementation Spec

**Phase:** 4 of 6
**Status:** In Progress
**Date:** 2026-03-06
**Depends on:** Phase 1 (Foundation) - COMPLETE, Phase 2 (Editor) - COMPLETE, Phase 3 (Template & Preview) - COMPLETE

---

## 1. Overview

Phase 4 adds PDF export functionality using a print-based approach. The strategy is straightforward: render the same template component at full, unscaled print dimensions in a hidden container, then trigger the browser's native print/save-as-PDF dialog. This guarantees pixel-perfect fidelity between the preview and the exported PDF because both render the exact same React component with the same data.

**Key deliverables:**
1. `usePDFExport` hook -- manages export state and triggers printing
2. Hidden print target component -- renders template at full size, off-screen
3. Enhanced print stylesheet -- `@media print` rules that hide everything except the resume
4. Updated `PreviewControls` -- enabled Export PDF button wired to the hook
5. Updated main page -- renders the hidden print target in the component tree

**Approach:** `react-to-print` library for reliable cross-browser print triggering with callback support.

---

## 2. File Structure

```
src/
  hooks/
    usePDFExport.ts              -- PDF export hook (new)
  components/
    preview/
      PreviewControls.tsx        -- Updated: enabled export button
      PrintTarget.tsx            -- Hidden full-size template renderer (new)
  app/
    globals.css                  -- Updated: enhanced @media print rules
    page.tsx                     -- Updated: renders PrintTarget + wires export
```

---

## 3. Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react-to-print` | `^3.0.2` | Cross-browser print dialog triggering with ref-based content selection |

**Install command:** `npm install react-to-print`

---

## 4. Component Contracts

### 4.1 `usePDFExport` Hook (`src/hooks/usePDFExport.ts`)

**Signature:**

```typescript
function usePDFExport(): {
  contentRef: React.RefObject<HTMLDivElement | null>;
  handleExport: () => void;
  isExporting: boolean;
}
```

**Returned values:**

| Property | Type | Description |
|----------|------|-------------|
| `contentRef` | `RefObject<HTMLDivElement \| null>` | Ref to attach to the print target container |
| `handleExport` | `() => void` | Triggers the browser print dialog |
| `isExporting` | `boolean` | `true` while the print dialog is open/preparing |

**Behavior:**
- Uses `react-to-print`'s `useReactToPrint` hook internally
- Sets `isExporting = true` before print, `false` after print completes or is cancelled
- Configures `@page` settings via the hook's `pageStyle` option
- Sets the document title to the user's name for a meaningful default filename
- Handles errors gracefully (logs to console, resets `isExporting`)

### 4.2 `PrintTarget` Component (`src/components/preview/PrintTarget.tsx`)

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `contentRef` | `RefObject<HTMLDivElement \| null>` | Ref from `usePDFExport` to attach to the container |

**Behavior:**
- Reads resume data via `useResumeData()` hook
- Resolves the template component from the registry using `state.meta.templateId`
- Renders the template at full, unscaled print dimensions (816x1056px US Letter)
- Container has `id="resume-print-target"` (matches existing print CSS)
- Hidden from screen view via CSS: positioned off-screen with `position: absolute; left: -9999px; top: 0`
- Visible during print via `@media print` rules
- Does NOT apply any CSS `transform: scale()` -- renders at 1:1 dimensions

**Rendering contract:**
```tsx
<div id="resume-print-target" ref={contentRef}>
  <TemplateComponent data={state} accentColor={accentColor} />
</div>
```

### 4.3 `PreviewControls` Updates (`src/components/preview/PreviewControls.tsx`)

**Changes:**
- Accept new props: `onExportPDF`, `isExporting`
- Replace the disabled placeholder button with a functional one
- Button calls `onExportPDF` on click
- Shows loading state when `isExporting` is true (spinner icon + "Exporting..." text)
- Uses `FileDown` icon from lucide-react (more specific than generic `Download`)

**Updated props interface:**

| Prop | Type | Description |
|------|------|-------------|
| `onExportPDF` | `() => void` | Callback to trigger PDF export |
| `isExporting` | `boolean` | Whether export is in progress |

### 4.4 Main Page Updates (`src/app/page.tsx`)

**Changes:**
- Import and instantiate `usePDFExport` hook
- Render `<PrintTarget contentRef={contentRef} />` in the component tree
- Pass `handleExport` and `isExporting` to `PreviewControls`
- Pass `handleExport` and `isExporting` to the header Export PDF button
- Both buttons (header + preview controls) trigger the same export function

---

## 5. Print Stylesheet Contract (`src/app/globals.css`)

### 5.1 `@media print` Rules

The existing foundation print rules will be enhanced:

```css
@media print {
  /* Hide all app UI */
  body > * {
    display: none !important;
  }

  /* Show only the print target */
  #resume-print-target {
    display: block !important;
    position: static !important;
    left: auto !important;
    top: auto !important;
    width: auto !important;
    overflow: visible !important;
  }

  /* Page setup */
  @page {
    size: letter;
    margin: 0;
  }

  /* Reset body/html for print */
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    width: auto !important;
    height: auto !important;
    overflow: visible !important;
    background: white !important;
  }

  /* Force color printing */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  /* Page break control for multi-page resumes */
  #resume-print-target {
    page-break-inside: auto;
  }
}
```

### 5.2 Key Print Considerations

| Concern | Solution |
|---------|----------|
| Colors not printing | `print-color-adjust: exact` on all elements |
| App UI visible in print | `body > * { display: none }` + `#resume-print-target { display: block }` |
| Wrong page size | `@page { size: letter; margin: 0 }` |
| Template scaled | Print target renders at 1:1, no CSS transform |
| Fonts missing | Inter loaded via `next/font/google` in layout.tsx -- persists to print |
| Links not clickable | Template uses `<a href>` tags -- preserved in PDF |
| Background colors stripped | `print-color-adjust: exact` forces backgrounds |

---

## 6. Data Flow

```
User clicks "Export PDF"
  --> page.tsx calls handleExport() from usePDFExport
  --> usePDFExport sets isExporting = true
  --> react-to-print reads contentRef (PrintTarget div)
  --> Browser applies @media print CSS:
      - Hides all app UI
      - Shows #resume-print-target at full size
      - Applies @page letter/no-margin rules
  --> Browser opens native print dialog
  --> User saves as PDF (or prints)
  --> react-to-print fires onAfterPrint callback
  --> usePDFExport sets isExporting = false
```

---

## 7. Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| AC-1 | Clicking "Export PDF" opens the browser's print/save-as-PDF dialog | Manual test in Chrome, Firefox, Edge |
| AC-2 | The PDF output matches the preview panel visually (fonts, colors, spacing, layout) | Visual comparison |
| AC-3 | The Export PDF button shows loading state during export | Observe button state change |
| AC-4 | Both header and preview controls Export buttons work identically | Click both, verify same behavior |
| AC-5 | App UI is completely hidden in the print output | Print preview shows only the resume |
| AC-6 | Links in the resume (email, website, LinkedIn) are clickable in the PDF | Open PDF, click links |
| AC-7 | Tiptap-generated HTML (bold, italic, lists, links) renders correctly in print | Add formatted content, verify in PDF |
| AC-8 | Page size is US Letter (8.5" x 11") with no margins | Check PDF dimensions |
| AC-9 | Colors print correctly (accent color, backgrounds) | Visual check in PDF |
| AC-10 | Multi-page resumes render properly with page breaks | Add enough content to overflow one page |

---

## 8. Implementation Order

1. Install `react-to-print` dependency
2. Create `PrintTarget` component
3. Create `usePDFExport` hook
4. Update print stylesheet in `globals.css`
5. Update `PreviewControls` to accept and use export props
6. Update `page.tsx` to wire everything together
7. Verify: build passes, export works in browser

---

*End of spec.*
