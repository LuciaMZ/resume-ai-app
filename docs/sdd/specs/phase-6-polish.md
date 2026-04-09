# Phase 6: Polish -- Spec

**Status:** Draft
**Depends on:** Phases 1-5 (all complete)
**Goal:** Elevate the visual quality, UX completeness, and robustness of the app to production-ready quality.

---

## 1. Scope Overview

Phase 6 adds no new data models or state management logic. It focuses on:

1. **Toast notification system** -- new provider + component
2. **Confirmation dialog** -- new reusable component
3. **Visual design polish** -- CSS/Tailwind refinements across all components
4. **Responsive layout** -- mobile/tablet panel stacking with working tab toggle
5. **Accessibility** -- ARIA labels, focus management, heading hierarchy
6. **Performance** -- lazy loading, debounced preview, memoization
7. **Final touches** -- favicon, metadata, empty states, transitions

---

## 2. New Components

### 2.1 Toast System

**Files:**
- `src/providers/ToastProvider.tsx`
- `src/components/shared/Toast.tsx`

**Interface:**
```typescript
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number; // default 3000ms
}

interface ToastContextValue {
  addToast: (message: string, type?: Toast['type']) => void;
}
```

**Behavior:**
- Toasts appear at bottom-right, stacked vertically
- Auto-dismiss after `duration` (default 3s)
- Slide-in from right, fade-out on dismiss
- Max 3 visible at once (oldest removed first)
- Used for: "Copied to clipboard", "Resume exported", "Settings saved", "Section deleted"

### 2.2 Confirmation Dialog

**File:** `src/components/shared/ConfirmDialog.tsx`

**Interface:**
```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmLabel?: string; // default "Delete"
  variant?: 'danger' | 'default'; // default 'danger'
}
```

**Behavior:**
- Modal overlay with backdrop blur (same as AISettingsModal)
- Focus trapped inside dialog
- Close on Escape or backdrop click
- Confirm button gets auto-focus
- Used for: section deletion (replaces inline confirm), reset resume

---

## 3. Visual Design Changes

### 3.1 Color Refinement

The current primary palette (blue) and surface palette (zinc) are good. Enhancements:
- Add a subtle gradient to the header bar (white to surface-50)
- Use `primary-50` backgrounds more for hover states in the editor
- Ensure all destructive actions use red-500/600 consistently

### 3.2 Header Polish

Current: Simple h-14 white bar with shadow-sm.
Enhanced:
- Bottom border with subtle gradient or slightly stronger shadow
- Logo icon gets a subtle hover effect
- Cleaner spacing between action buttons

### 3.3 Section Editor Cards

Current: `rounded-xl border border-surface-200 bg-white shadow-sm`
Enhanced:
- Hover state: subtle border color change + slight shadow lift
- Drag handle: visible dots with hover highlight
- Collapse/expand: animated height transition via CSS grid trick
- Section title: underline on hover to indicate editability
- Delete confirmation: use ConfirmDialog instead of inline "Delete?"

### 3.4 Form Inputs

Current styling is good. Enhancements:
- Add `transition-colors` and `transition-shadow` for smooth focus ring appearance
- Consistent disabled state styling
- Subtle shadow on focus (shadow-sm)

### 3.5 Buttons

Standardize all buttons to three variants:
- **Primary:** `bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm`
- **Secondary/Ghost:** `text-surface-600 hover:bg-surface-100 hover:text-surface-900`
- **Danger:** `text-red-600 hover:bg-red-50` or `bg-red-600 text-white hover:bg-red-700`
- All buttons: `transition-all duration-150` for smooth hover/active states

### 3.6 Skills Tags

Current: `bg-surface-100 px-3 py-1 text-sm`
Enhanced:
- `hover:bg-surface-200` on the tag itself
- Remove button (X): `opacity-0 group-hover:opacity-100` approach, or always-visible with `hover:bg-red-100 hover:text-red-500`

### 3.7 Add Section Dropdown

Current: basic dropdown with hover states.
Enhanced:
- Animated open (scale + opacity transition)
- Icons next to each section type
- Better disabled state visual

### 3.8 AI Panel

Current styling is good. Enhancements:
- Slide-in animation when AI is enabled (already has transition-all)
- Suggestion cards: subtle left border accent matching category color

---

## 4. Responsive Layout

### 4.1 Breakpoint Strategy

- `>= 1024px (lg)`: Side-by-side panels (current behavior)
- `< 1024px`: Stacked layout with tab toggle

### 4.2 Mobile Tab Toggle

Current: Two static buttons at the bottom, not functional.
Enhanced:
- Wire up state to toggle between Editor, Preview, and AI (if enabled)
- Active tab has bottom border indicator
- Smooth panel transition (simple show/hide, no animation needed)
- Preview panel renders the scaled preview (already responsive via ResizeObserver)
- AI panel appears as a third tab only when AI is enabled

### 4.3 Touch Targets

- All interactive elements minimum 44x44px touch target (or equivalent padding)
- Drag handles hidden on mobile (DnD doesn't work well with touch on this setup)

---

## 5. Accessibility

### 5.1 Heading Hierarchy

- `h1`: "Resume AI APP" in header
- `h2`: Section group labels ("Personal Information", "Sections")
- `h3`: Individual section titles (in SectionEditor header)
- Maintained in current implementation, just ensure consistency.

### 5.2 ARIA Labels

All interactive elements already have aria-labels. Audit and add any missing ones:
- Add Section dropdown toggle
- Mobile tab buttons
- Toast dismiss
- Confirm dialog buttons

### 5.3 Focus Management

- **Modals (AISettingsModal, ConfirmDialog):** Trap focus inside when open, return focus to trigger on close.
- **Toast:** Not focusable (informational only).
- **Add Section dropdown:** Focus first item on open, return focus to trigger on close.

### 5.4 Keyboard Navigation

- Tab order: Header actions -> Editor sections (top to bottom) -> each section's inputs
- Escape closes dropdowns and modals
- Enter confirms dialogs

---

## 6. Performance

### 6.1 Debounced Preview

The preview already re-renders when state changes. Add a 150ms debounce in ResumePreview to avoid updating on every keystroke.

### 6.2 Lazy AI Panel

Use React.lazy + Suspense for the AIPanel component since it's only needed when AI is enabled.

### 6.3 Memoization

- Memoize the ClassicTemplate component (it only re-renders when data or accentColor change)
- Memoize SectionEditor to avoid re-rendering all sections when one entry changes

---

## 7. Final Touches

### 7.1 Favicon

Generate a simple SVG favicon using the FileText icon concept (matching the logo).
Place at `src/app/favicon.ico` (or use `icon.svg` with Next.js App Router).

### 7.2 Metadata

Already has a title and description. Add:
- `themeColor`
- `viewport` settings (already handled by Next.js)
- Open Graph basics (title, description)

### 7.3 Empty States

Already handled in most editors. Polish:
- Add descriptive icons to empty states
- Ensure consistent styling across all empty states
- "No sections yet" state in SectionList is already present

### 7.4 Loading State

Add a brief skeleton/loading screen on initial mount while localStorage data hydrates. Use a simple `isHydrated` check in the provider.

---

## 8. Integration Points

### Toast Wiring

| Action | Toast Message | Type |
|--------|---------------|------|
| Copy AI suggestion | "Copied to clipboard" | success |
| Export PDF (after print) | "Resume exported" | success |
| Save AI settings | "Settings saved" | success |
| Delete section | "Section deleted" | success |
| Remove API key | "API key removed" | info |
| Reset resume | "Resume reset" | info |
| AI error | (error message) | error |

### Confirm Dialog Wiring

| Action | Dialog |
|--------|--------|
| Delete section | "Delete {section.title}? This cannot be undone." |
| Reset resume | "Reset your resume? All content will be lost." |

---

## 9. Files Changed/Created

### New Files
- `src/providers/ToastProvider.tsx`
- `src/components/shared/Toast.tsx`
- `src/components/shared/ConfirmDialog.tsx`
- `src/app/icon.svg` (favicon)

### Modified Files
- `src/app/layout.tsx` -- add ToastProvider, update metadata
- `src/app/page.tsx` -- responsive mobile tabs, lazy AI, loading state
- `src/app/globals.css` -- animations, transitions, responsive utilities
- `src/components/editor/ResumeEditor.tsx` -- reset resume, polish
- `src/components/editor/SectionEditor.tsx` -- ConfirmDialog, animations
- `src/components/editor/SectionList.tsx` -- empty state polish
- `src/components/editor/PersonalInfoForm.tsx` -- input polish
- `src/components/editor/ExperienceEditor.tsx` -- ConfirmDialog, polish
- `src/components/editor/EducationEditor.tsx` -- ConfirmDialog, polish
- `src/components/editor/SkillsEditor.tsx` -- tag hover, polish
- `src/components/editor/TiptapEditor.tsx` -- placeholder polish
- `src/components/editor/EditorToolbar.tsx` -- tooltip, polish
- `src/components/preview/ResumePreview.tsx` -- debounced, loading
- `src/components/preview/PreviewControls.tsx` -- polish
- `src/components/ai/AIPanel.tsx` -- polish
- `src/components/ai/AISuggestionCard.tsx` -- toast on copy, polish
- `src/components/ai/AISettingsModal.tsx` -- toast on save, focus trap

---

## 10. Constraints

- **Do NOT** change data model types in `src/types/`
- **Do NOT** change reducer logic in `ResumeProvider.tsx` (except adding RESET_RESUME if missing)
- **Do NOT** change template inline styles (print compatibility)
- **Do NOT** add new npm dependencies -- use only what's installed
- All changes must pass `next build` without errors
