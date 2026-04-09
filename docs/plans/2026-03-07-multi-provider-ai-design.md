# Design: Multi-Provider AI Abstraction

**Date:** 2026-03-07
**Status:** Approved
**Goal:** Abstract the AI suggestion system to support multiple providers (OpenAI, Gemini, and future providers) with a plugin-like interface.

---

## Decisions

1. **Provider abstraction with registry** — same pattern as template registry. Adding a provider = implement interface + register.
2. **One API key per provider** — users can configure keys for multiple providers simultaneously and switch freely.
3. **Dynamic model fetching** — fetch model list from provider API when key is saved, cache in localStorage. No hardcoded model lists.
4. **Flat settings modal** — provider selector at top, key + model fields adapt based on selected provider. No tabs.
5. **Native API per provider** — each provider owns its request/response format behind the abstraction. No OpenAI-compatible shortcuts.

---

## 1. Provider Interface & Data Model

### Provider Interface

```typescript
// types/ai.ts

interface AIProviderDefinition {
  id: string;                    // 'openai' | 'gemini' | ...
  name: string;                  // 'OpenAI' | 'Google Gemini'
  defaultModel: string;          // Fallback if no models fetched yet
  apiKeyPlaceholder: string;     // 'sk-...' | 'AIza...'
  apiKeyHelpUrl: string;         // Link to "get your API key" page

  generateSuggestions(
    apiKey: string,
    model: string,
    sectionType: SectionType,
    content: string
  ): Promise<AISuggestion[]>;

  fetchModels(apiKey: string): Promise<AIModel[]>;
}

interface AIModel {
  id: string;       // 'gpt-5-mini', 'gemini-2.0-flash'
  name: string;     // Display name
}
```

### Provider Registry

```typescript
// lib/ai/registry.ts
export const providerRegistry: Record<string, AIProviderDefinition> = {
  openai: openaiProvider,
  gemini: geminiProvider,
};
```

### Updated AIConfig

```typescript
interface AIConfig {
  activeProvider: string;                      // Which provider is currently selected
  providers: Record<string, ProviderConfig>;   // Per-provider configuration
}

interface ProviderConfig {
  apiKey: string;
  model: string;
  cachedModels?: AIModel[];   // Fetched from API, cached in localStorage
}
```

### Migration

Old `AIConfig` format (`{ apiKey, model }`) auto-migrates on load to:
```typescript
{
  activeProvider: 'openai',
  providers: {
    openai: { apiKey: oldConfig.apiKey, model: oldConfig.model }
  }
}
```

---

## 2. Provider Implementations

### File Structure

```
src/lib/ai/
  index.ts              # Main entry: generateSuggestions() delegates to active provider
  registry.ts           # Provider registry
  prompts.ts            # Shared system prompts (buildSystemPrompt)
  utils.ts              # stripHtml, parseSuggestions, AIError
  providers/
    openai.ts           # OpenAI implementation
    gemini.ts           # Gemini implementation
```

### OpenAI Provider

- **Endpoint:** `https://api.openai.com/v1/chat/completions`
- **Auth:** `Authorization: Bearer {apiKey}`
- **Model list:** `GET https://api.openai.com/v1/models` filtered to chat models (gpt-*)
- **Request/response:** Refactored from existing `lib/ai.ts` (handles legacy + newer response formats)

### Gemini Provider

- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- **Auth:** `?key={apiKey}` query parameter
- **Model list:** `GET https://generativelanguage.googleapis.com/v1beta/models?key={apiKey}` filtered to models supporting `generateContent`
- **Request format:** Gemini native `contents` array with `parts`
- **Response parsing:** Extract from `candidates[0].content.parts[0].text`, parse JSON suggestions

### Shared Logic (provider-agnostic)

- `buildSystemPrompt(sectionType)` — same prompt regardless of provider
- `stripHtml()` — HTML to plain text conversion
- `AIError` class — typed error codes (unauthorized, rate_limit, network, parse, unknown)
- `parseSuggestions()` — parse JSON array of suggestions, strip markdown fences, validate categories

---

## 3. Settings UI Changes

### Modal Layout

```
+--------------------------------------------------+
|  AI Settings                            [X]       |
|                                                   |
|  Provider:  [ OpenAI v ]                          |
|                                                   |
|  API Key:   [sk-...                    ] [eye]    |
|             "Get your API key" (link)             |
|                                                   |
|  Model:     [ gpt-5-mini v ]  [Refresh]           |
|                                                   |
|  Status:  Connected / Not configured              |
|                                                   |
|  [Save]              [Remove Key]                 |
+--------------------------------------------------+
```

### Key Behaviors

1. **Provider dropdown** — populated from `providerRegistry`. Switching swaps key/model fields to that provider's saved config.
2. **API key field** — placeholder and help link change per provider.
3. **Model dropdown** — shows cached models if available, otherwise provider's `defaultModel`.
4. **Refresh button** — fetches models from API, caches in `AIConfig.providers[id].cachedModels`. Disabled if no key.
5. **Save** — saves key + model for current provider, sets it as `activeProvider`, triggers model fetch on first save.
6. **Remove Key** — clears that provider's config. If it was active provider, `isAIEnabled` becomes false.

### AIProvider Context Changes

- `aiConfig` uses new multi-provider shape
- `isAIEnabled` = active provider exists with non-empty API key
- Add `setActiveProvider(providerId)` method
- `setAIConfig` / `clearAIConfig` become provider-scoped
- Migration runs once on hydration

### Unchanged Components

- `AIPanel.tsx` — calls `useAISuggestions()`, provider-agnostic
- `AISuggestionCard.tsx` — purely presentational
- `ActiveSectionProvider` — unrelated
- Builder layout/page — `isAIEnabled` still controls conditional rendering

---

## 4. Testing Strategy

- Unit tests for each provider's `generateSuggestions()` and `fetchModels()` (mocked fetch)
- Unit tests for migration logic (old format to new format)
- Unit tests for shared utils (parseSuggestions, stripHtml)
- Update existing `ai.test.ts` to work with the new structure
- Settings modal tests for provider switching, key persistence, model refresh
