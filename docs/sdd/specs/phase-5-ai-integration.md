# Phase 5: AI Integration -- Spec

**Status:** In Progress
**Depends on:** Phases 1-4 (Foundation, Editor, Template & Preview, PDF Export)

---

## 1. Overview

Phase 5 adds optional AI-powered suggestions to the resume builder. When users configure an OpenAI API key, a third panel appears alongside the editor and preview, showing contextual AI suggestions for the section they are currently editing. Users can copy suggestions to their clipboard and paste them into the editor. Without an API key, the app remains a clean 2-panel layout with zero AI-related UI clutter.

---

## 2. Architecture

### 2.1 New Providers

| Provider | File | Purpose |
|----------|------|---------|
| `AIProvider` | `src/providers/AIProvider.tsx` | Manages `AIConfig` (apiKey, model). Persists to localStorage via `STORAGE_KEYS.AI_CONFIG`. Exposes `isAIEnabled` boolean. |
| `ActiveSectionProvider` | `src/providers/ActiveSectionProvider.tsx` | Tracks which editor section currently has focus. Provides `activeSectionId`, `activeSectionType`, `activeSectionContent`, `setActiveSection()`. |

### 2.2 Provider Hierarchy (layout.tsx)

```
<ResumeProvider>
  <AIProvider>
    <ActiveSectionProvider>
      {children}
    </ActiveSectionProvider>
  </AIProvider>
</ResumeProvider>
```

### 2.3 New Modules

| Module | File | Purpose |
|--------|------|---------|
| OpenAI Client | `src/lib/ai.ts` | `generateSuggestions()` -- calls OpenAI API client-side |
| AI Suggestions Hook | `src/hooks/useAISuggestions.ts` | Manages fetching/state of suggestions for a section |
| AI Settings Modal | `src/components/ai/AISettingsModal.tsx` | Modal for entering/removing API key |
| AI Suggestion Card | `src/components/ai/AISuggestionCard.tsx` | Individual suggestion display with copy button |
| AI Panel | `src/components/ai/AIPanel.tsx` | Right-side panel containing AI suggestions list |

---

## 3. Contracts

### 3.1 AIProvider Context

```typescript
interface AIContextValue {
  aiConfig: AIConfig | null;
  setAIConfig: (config: AIConfig) => void;
  clearAIConfig: () => void;
  isAIEnabled: boolean;
}
```

- `aiConfig` is `null` when no API key is set
- `isAIEnabled` is `true` when `aiConfig !== null && aiConfig.apiKey.length > 0`
- On mount, loads from `STORAGE_KEYS.AI_CONFIG`
- On `setAIConfig`, persists to localStorage
- On `clearAIConfig`, removes from localStorage and sets `aiConfig` to `null`

### 3.2 ActiveSectionProvider Context

```typescript
interface ActiveSectionContextValue {
  activeSectionId: string | null;
  activeSectionType: SectionType | null;
  activeSectionContent: string;
  setActiveSection: (id: string, type: SectionType, content: string) => void;
  clearActiveSection: () => void;
}
```

- Default state: all null/empty
- `activeSectionContent` is plain text (HTML stripped) for sending to AI
- Called by editor components on focus

### 3.3 OpenAI Client (`src/lib/ai.ts`)

```typescript
function generateSuggestions(
  config: AIConfig,
  sectionType: SectionType,
  content: string
): Promise<AISuggestion[]>
```

- Calls `POST https://api.openai.com/v1/chat/completions`
- Model defaults to `gpt-4o-mini` if `config.model` is not set
- System prompt from PRD Appendix 11.3
- Returns parsed `AISuggestion[]` with generated IDs and timestamps
- Throws typed errors for: invalid key (401), rate limit (429), network errors

```typescript
function stripHtml(html: string): string
```

- Strips HTML tags, decodes entities, returns plain text
- Used before sending content to OpenAI

### 3.4 useAISuggestions Hook

```typescript
interface UseAISuggestionsReturn {
  suggestions: AISuggestion[];
  isLoading: boolean;
  error: string | null;
  fetchSuggestions: () => void;
  clearSuggestions: () => void;
}

function useAISuggestions(): UseAISuggestionsReturn
```

- Reads `aiConfig` from AIProvider context
- Reads active section from ActiveSectionProvider context
- `fetchSuggestions()` is manually triggered (not auto-fetch)
- On fetch: sets `isLoading=true`, calls `generateSuggestions()`, sets results or error
- Clears suggestions when active section changes

### 3.5 Component Props

**AISettingsModal:**
```typescript
interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**AISuggestionCard:**
```typescript
interface AISuggestionCardProps {
  suggestion: AISuggestion;
}
```

**AIPanel:**
```typescript
// No props -- reads from ActiveSectionProvider and useAISuggestions
```

---

## 4. Layout Changes

### 4.1 Dynamic 3-Panel Layout

| State | Editor | Preview | AI Panel |
|-------|--------|---------|----------|
| AI disabled | 50% | 50% | hidden |
| AI enabled | ~35% | ~40% | ~25% |

- AI panel slides in with 300ms CSS transition
- Panel widths use CSS flex basis
- Below `lg` breakpoint: panels stack vertically

### 4.2 Page.tsx Updates

- Import `AIPanel`, `AISettingsModal`, `useAIConfig` hook
- Settings button opens `AISettingsModal`
- When `isAIEnabled`, render AI panel as third section in main flex container
- Settings button shows a subtle dot indicator when AI is enabled

---

## 5. Focus Tracking Integration

### 5.1 Section Editor Changes

The `SectionEditor` component wraps its content in a `div` with an `onFocus` handler (via event delegation) that calls `setActiveSection()` with:
- The section's `id`
- The section's `type`
- The plain-text content of the section's entries

This is achieved by adding `onFocus` to the section content wrapper div in `SectionEditor.tsx`. No changes to individual editor components (SummaryEditor, ExperienceEditor, etc.) are needed.

### 5.2 Content Extraction

For AI purposes, we extract plain text from sections:
- **summary**: `entry.content` (HTML stripped)
- **experience**: Concatenate `jobTitle + company + description` for each entry (HTML stripped)
- **education**: Concatenate `institution + degree + description` for each entry (HTML stripped)
- **skills**: Concatenate all category names and skills as comma-separated text
- **custom**: Concatenate `title + description` for each entry (HTML stripped)

---

## 6. Category Badge Colors

| Category | Badge Color |
|----------|-------------|
| `rewrite` | Blue (`bg-blue-100 text-blue-700`) |
| `action-verb` | Green (`bg-green-100 text-green-700`) |
| `quantify` | Purple (`bg-purple-100 text-purple-700`) |
| `ats-optimize` | Orange (`bg-amber-100 text-amber-700`) |
| `concise` | Teal (`bg-teal-100 text-teal-700`) |

---

## 7. Error Handling

| Error | User-Facing Message |
|-------|-------------------|
| 401 Unauthorized | "Invalid API key. Please check your key in Settings." |
| 429 Rate Limited | "Rate limit exceeded. Please wait a moment and try again." |
| Network error | "Could not connect to OpenAI. Check your internet connection." |
| Empty content | "Start typing in a section to get AI suggestions." |
| Parse error | "Failed to parse AI response. Please try again." |

---

## 8. Files Created/Modified

### New Files
- `src/providers/AIProvider.tsx`
- `src/providers/ActiveSectionProvider.tsx`
- `src/hooks/useAISuggestions.ts`
- `src/hooks/useAIConfig.ts`
- `src/hooks/useActiveSection.ts`
- `src/lib/ai.ts`
- `src/components/ai/AIPanel.tsx`
- `src/components/ai/AISuggestionCard.tsx`
- `src/components/ai/AISettingsModal.tsx`

### Modified Files
- `src/app/layout.tsx` -- wrap with AIProvider + ActiveSectionProvider
- `src/app/page.tsx` -- 3-panel layout, settings modal, AI indicator
- `src/components/editor/SectionEditor.tsx` -- add onFocus for active section tracking

---

## 9. Acceptance Criteria

- [ ] User can enter an OpenAI API key via the Settings modal
- [ ] API key persists across page reloads (localStorage)
- [ ] User can remove their API key and the AI panel disappears
- [ ] Without an API key, zero AI-related UI is visible
- [ ] When AI is enabled, a third panel appears with smooth animation
- [ ] Clicking into a section updates the AI panel context
- [ ] User can click "Generate" to fetch AI suggestions for the active section
- [ ] Suggestions display with category badges and copy buttons
- [ ] Copy button copies suggestion text and shows confirmation
- [ ] Loading state shows skeleton/spinner during API call
- [ ] Error states display meaningful messages with retry option
- [ ] Empty state guides user to select a section or add content
- [ ] Only plain text of the active section is sent to OpenAI (not the full resume)
- [ ] HTML tags are stripped before sending to the API
