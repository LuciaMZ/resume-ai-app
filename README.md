# ResuMe AI

A client-side resume builder powered by AI. Build, edit, and export professional resumes — all from your browser with no backend required.

[Live Demo](LINK) · [Report Bug](https://github.com/CHANGE)

## Features

- **AI-Powered Suggestions** — Connect your own OpenAI API key for contextual resume improvements
- **Rich Text Editing** — Tiptap-based editor with bold, italic, underline, and link support
- **Drag & Drop** — Reorder sections and entries with smooth drag-and-drop
- **PDF Export** — Print-ready PDF output at US Letter size
- **4 Resume Templates** — Classic (single-column), Modern (two-column sidebar), Academic (serif scholarly CV), and Compact (space-optimized, fits 30-40% more content per page), all with accent color customization
- **Privacy First** — All data stored locally in your browser (localStorage), nothing sent to a server
- **Live Preview** — Real-time scaled preview that updates as you type

## Tech Stack

- **Framework**: Next.js 16 + React 19
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript
- **State**: React Context + useReducer
- **Rich Text**: Tiptap
- **Drag & Drop**: dnd-kit
- **PDF**: react-to-print
- **Testing**: Vitest + React Testing Library

## Getting Started

### Prerequisites

- Node.js 20.19+ (LTS recommended)
- pnpm

### Installation

```bash
git clone **LINK GOES HERE**
cd RESUMEAIAPP
pnpm install
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
pnpm build
```

### Testing

```bash
pnpm test            # Run all tests
pnpm test:watch      # Watch mode
pnpm test:coverage   # With coverage
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   └── builder/              # Resume builder route
│       └── layout.tsx        # Provider wrappers
├── components/
│   ├── templates/            # Resume templates (pure renderers)
│   │   ├── classic/          # Classic — single-column professional
│   │   ├── modern/           # Modern — two-column with accent sidebar
│   │   ├── academic/         # Academic — serif scholarly CV
│   │   ├── compact/          # Compact — space-optimized dense layout
│   │   ├── shared/           # Shared template utilities
│   │   └── registry.ts       # Template registry
│   └── ...                   # Editor, preview, and UI components
├── providers/                # React Context providers
│   ├── ResumeProvider.tsx    # Core resume state
│   ├── AIProvider.tsx        # AI configuration
│   ├── ActiveSectionProvider.tsx
│   └── ToastProvider.tsx
├── lib/
│   ├── ai/                   # AI integration (multi-provider)
│   └── storage.ts            # localStorage helpers
└── types/
    └── resume.ts             # Data model types
```

## License

This project is open source and available under the [MIT License](LICENSE).
