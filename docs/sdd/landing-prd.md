# PRD: Resume AI APP v2 -- Landing Page

**Version:** 1.0
**Date:** 2026-03-06
**Status:** Draft
**Author:** Product & Engineering
**Parent PRD:** `docs/sdd/prd.md` (Resume AI App v2 Core)

---

## 1. Overview

### 1.1 Problem Statement

RESUME AI APP's builder currently loads directly at the root route (`/`) with no marketing context. A first-time visitor lands straight into the editor -- there is no explanation of what the product does, why they should trust it, or what differentiates it from dozens of other resume builders. This creates three problems:

1. **No conversion funnel.** Users who arrive via search, social shares, or links have zero context before being thrown into the app. There is no opportunity to communicate value propositions.
2. **No SEO surface.** The builder is a client-rendered SPA with minimal static content. A landing page provides crawlable, indexable content for organic discovery.
3. **No trust establishment.** Key differentiators (free forever, no sign-up, data stays local, open source) are invisible until a user actively explores the app.

### 1.2 Proposed Solution

Build a single-page marketing landing page at the root route (`/`) that communicates the product's value proposition and drives visitors to try the builder at `/builder`. The page uses a **glassmorphism** design language -- dark gradient backgrounds, frosted glass surfaces, floating decorative orbs, and subtle glow effects -- to create a visually distinctive, premium feel that positions Resume AI APP as a modern, polished tool rather than a generic free utility.

The landing page is entirely static (no client-side data fetching, no authentication). It consists of 8 distinct sections from hero to footer, each designed to progressively build conviction: capture attention, explain features, demonstrate simplicity, highlight AI capabilities, establish trust, and present a final call-to-action.

### 1.3 Target Users

| Persona | Landing Page Goal |
|---------|-------------------|
| **Organic Search Visitor** | Arrived via Google query ("free resume builder", "AI resume tool"). Needs to understand what this is and why it is better than the top 3 results. |
| **Link Referral Visitor** | Arrived via a shared link (social media, forum, friend). Has minimal context. Needs a quick hook and CTA. |
| **Returning User** | Already knows the product. Needs a fast path to `/builder` (hero CTA, navbar link). Should not be blocked by the landing page. |
| **Technical Evaluator** | Checking out the product before recommending it. Looks for trust signals (open source, privacy, no vendor lock-in). |

### 1.4 Relationship to Core PRD

This PRD covers only the landing page feature. The resume builder, AI integration, template system, data model, and all other application functionality are defined in the core PRD (`docs/sdd/prd.md`). The landing page does not interact with any builder state -- it is a purely presentational marketing page that links to `/builder`.

---

## 2. Goals & Success Metrics

### 2.1 Primary Goals

1. **Communicate the value proposition** -- Within 5 seconds of landing, a visitor should understand: (a) this is a free resume builder, (b) it has AI features, (c) no sign-up is needed.
2. **Drive builder adoption** -- The primary conversion action is clicking "Start Building" and entering the builder at `/builder`.
3. **Establish trust and differentiation** -- Clearly convey that data never leaves the browser, the product is free and open source, and AI is optional with BYO API key.
4. **Create a premium visual impression** -- The glassmorphism design should feel polished and intentional, signaling quality before the user even tries the product.

### 2.2 Key Metrics / KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| Landing-to-builder click-through rate | > 40% | Visitors who navigate to `/builder` / total landing page visitors |
| Time to first CTA interaction | < 10 seconds | Time from page load to first CTA click (hero section) |
| Bounce rate | < 50% | Visitors who leave without interacting |
| Largest Contentful Paint (LCP) | < 1.5 seconds | Core Web Vitals |
| Cumulative Layout Shift (CLS) | < 0.05 | Core Web Vitals |
| Lighthouse Performance score | > 90 | Desktop audit |

### 2.3 Non-Goals (Out of Scope)

- Blog, changelog, or documentation pages
- Pricing page (the product is free)
- User testimonials or reviews (no user base yet -- social proof is structural: open source, privacy, no sign-up)
- Newsletter signup or email capture
- Analytics integration (can be added later)
- Light mode / theme toggle (landing page is dark-only)
- Internationalization (English only)
- A/B testing infrastructure

---

## 3. User Stories & Requirements

### 3.1 User Stories

| ID | Story | Priority |
|----|-------|----------|
| LP-01 | As a first-time visitor, I want to immediately understand what Resume AI APP does so that I can decide whether to try it. | Must-have |
| LP-02 | As a visitor, I want to see the key features of the resume builder so that I can assess whether it meets my needs. | Must-have |
| LP-03 | As a visitor, I want to see a simple "how it works" guide so that I understand how easy it is to use. | Must-have |
| LP-04 | As a visitor, I want to see a visual preview of the builder in action so that I can judge the quality before committing. | Must-have |
| LP-05 | As a visitor, I want to understand the AI feature and that it requires my own API key so that I have correct expectations. | Must-have |
| LP-06 | As a privacy-conscious visitor, I want to see clear trust signals (no data leaves browser, no sign-up, open source) so that I feel safe using the product. | Must-have |
| LP-07 | As a visitor who is convinced, I want a clear call-to-action button that takes me directly to the builder so that I can start immediately. | Must-have |
| LP-08 | As a returning user, I want to quickly navigate to the builder from the navbar without scrolling through marketing content. | Must-have |
| LP-09 | As a mobile visitor, I want the landing page to be fully responsive and visually appealing on my phone so that I can learn about the product and navigate to the builder. | Must-have |
| LP-10 | As a visitor, I want smooth scroll animations as sections come into view so that the page feels polished and engaging. | Should-have |
| LP-11 | As a visitor, I want the footer to contain relevant links (GitHub, builder, top of page) so that I can navigate easily. | Should-have |

### 3.2 Functional Requirements

#### Must-Have

| ID | Requirement | Details |
|----|------------|---------|
| LFR-01 | **Route restructure** | Move current `src/app/page.tsx` to `src/app/builder/page.tsx`. Create new `src/app/page.tsx` for the landing page. The builder layout at `/builder` must include its own providers if they are not needed by the landing page (see Technical Considerations). |
| LFR-02 | **Glassmorphism navbar** | Floating navigation bar with glass effect (`backdrop-blur-xl`, `bg-white/5`, `border-white/10`). Fixed/sticky positioning with `top-4 left-4 right-4` offset and `rounded-2xl`. Contains: logo (left), nav links (center/right: Features, How It Works, AI), CTA button "Start Building" (right). Collapses to hamburger on mobile. |
| LFR-03 | **Hero section** | Full-viewport height. Bold gradient-text headline ("Build Your Perfect Resume with AI"). Descriptive sub-headline (1-2 sentences). Primary CTA button ("Start Building" -> `/builder`). Secondary CTA or subtle link ("Learn More" -> scroll to features). Decorative background orbs. |
| LFR-04 | **Features section** | Grid of 4-5 feature cards using glass card styling. Each card: Lucide icon, feature title, 1-2 sentence description. Features to highlight: (1) WYSIWYG Editor, (2) Real-Time Preview, (3) AI Suggestions, (4) PDF Export, (5) No Sign-Up Needed. |
| LFR-05 | **How It Works section** | 3-step horizontal layout (vertical on mobile). Each step: numbered indicator, Lucide icon, title, description. Steps: (1) "Open the Builder" -- no sign-up, start immediately; (2) "Edit Your Resume" -- WYSIWYG editor with real-time preview; (3) "Export as PDF" -- download and apply. Visual connector lines between steps. |
| LFR-06 | **Template preview section** | A visual mockup/screenshot of the builder interface. Can be a static image, a styled placeholder, or a CSS-rendered mock. Should convey the split-panel editor+preview layout. Framed in a glass container with glow effects. |
| LFR-07 | **AI section** | Dedicated section explaining the BYO API key model. Key messages: (1) AI is optional -- the builder works perfectly without it, (2) Bring your own OpenAI API key, (3) AI suggests improvements to your content, (4) No subscription, no vendor lock-in. Use a glass card layout with an icon grid or feature list. |
| LFR-08 | **Trust / Social proof section** | 3-4 trust badges/cards. Content: (1) "Free Forever" -- no hidden costs or premium tiers, (2) "Privacy First" -- all data stays in your browser, (3) "Open Source" -- transparent, community-driven (with GitHub link), (4) "No Account Required" -- start building in seconds. Each badge: Lucide icon + title + brief description. |
| LFR-09 | **Final CTA section** | Full-width section with gradient background, compelling headline ("Ready to Build Your Resume?"), CTA button ("Start Building Now" -> `/builder`). Creates urgency and provides a clear exit point for scrollers. |
| LFR-10 | **Footer** | Minimal footer with: Resume AI APP logo/name, copyright, GitHub link, "Built with Next.js & Tailwind" credit (optional), back-to-top link. Dark background consistent with overall theme. |
| LFR-11 | **Responsive design** | All sections must be fully responsive. Glass effects simplify on small screens (reduce blur intensity, simplify orb count). Navbar collapses to mobile menu. Feature/step grids stack vertically. |
| LFR-12 | **Smooth scroll navigation** | Navbar links scroll smoothly to their respective sections using `scroll-behavior: smooth` or equivalent. URL hash updates for deep-linkability. |

#### Should-Have

| ID | Requirement | Details |
|----|------------|---------|
| LFR-13 | **Scroll-triggered fade-in animations** | Sections fade in and slide up slightly as they enter the viewport. Use `IntersectionObserver` (no external animation library). CSS transitions only. |
| LFR-14 | **Animated background orbs** | 3-5 large, blurred gradient circles floating in the background. Slow CSS animation (pulse/float). Different colors from the accent palette. Fixed or absolute positioning so they create depth as user scrolls. |
| LFR-15 | **Hover effects on glass cards** | Cards gain subtle glow and slight `translateY` lift on hover. Use `box-shadow` for glow, not `transform: scale` (avoids layout shift). |
| LFR-16 | **Keyboard-accessible navigation** | All interactive elements (CTAs, navbar links, mobile menu) are keyboard-accessible. Focus indicators are visible against the dark background. |

#### Nice-to-Have

| ID | Requirement | Details |
|----|------------|---------|
| LFR-17 | **Typed text animation in hero** | The headline or a sub-element uses a typing effect to cycle through phrases ("Build", "Polish", "Export"). CSS-only or minimal JS. |
| LFR-18 | **Parallax depth on orbs** | Background orbs move at different speeds during scroll, creating a subtle parallax effect. CSS `transform: translateZ` or scroll-linked JS. |
| LFR-19 | **GitHub star count badge** | Dynamically fetch and display the GitHub repository star count in the trust section. Cached/static fallback if API is unavailable. |

### 3.3 Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | LCP < 1.5s. Total page weight < 500KB (including images). No heavy JS animation libraries (Framer Motion, GSAP). CSS animations only. Images optimized via Next.js `<Image>` component. |
| **Accessibility** | WCAG 2.1 AA compliance. All text meets 4.5:1 contrast ratio against dark backgrounds. Focus indicators visible on dark surfaces (use ring-offset with custom color). Skip-to-content link. ARIA landmarks for all major sections. |
| **SEO** | Server-rendered static page (Next.js SSG). Proper `<title>`, `<meta description>`, Open Graph tags, and structured data. Semantic HTML (`<header>`, `<main>`, `<section>`, `<footer>`, `<nav>`). |
| **Browser Support** | Chrome (latest 2), Firefox (latest 2), Safari (latest 2), Edge (latest 2). `backdrop-filter` fallback for browsers that do not support it (solid semi-transparent background). |
| **Bundle Size** | Landing page should not import any builder dependencies (Tiptap, dnd-kit, react-to-print). Route-level code splitting ensures the builder bundle is only loaded at `/builder`. |

---

## 4. Scope & Milestones

### 4.1 MVP Scope

The landing page MVP includes all **Must-have** requirements from Section 3.2:

- Route restructure (`/` -> landing, `/builder` -> builder)
- All 8 page sections (navbar, hero, features, how it works, template preview, AI, trust, final CTA, footer)
- Glassmorphism design system (glass cards, gradient backgrounds, floating orbs)
- Full responsive design
- Smooth scroll navigation
- Static rendering (SSG)

### 4.2 Milestone Breakdown

#### Phase 1: Route Restructure & Scaffold (Day 1)

| Task | Deliverable |
|------|-------------|
| Move builder to `/builder` | Move `src/app/page.tsx` to `src/app/builder/page.tsx`. Create `src/app/builder/layout.tsx` that wraps builder-specific providers (`ResumeProvider`, `AIProvider`, `ActiveSectionProvider`). Update root `layout.tsx` to remove builder-specific providers from the global layout. |
| Create landing page shell | New `src/app/page.tsx` as a server component. Basic structure with empty section placeholders. |
| Verify routing | Confirm `/` shows landing page, `/builder` shows the resume builder. Confirm no broken imports. |
| Landing page CSS foundation | Add landing-page-specific CSS variables and keyframe animations to `globals.css` or a dedicated `landing.css` file. Define glass card utilities, orb animations, gradient text classes. |

#### Phase 2: Design System & Shared Elements (Day 2)

| Task | Deliverable |
|------|-------------|
| Glassmorphism navbar | Floating glass navbar with logo, nav links, CTA button. Sticky positioning. Mobile hamburger menu. |
| Background orbs | Reusable `BackgroundOrbs` component with 3-5 animated gradient blobs. CSS keyframe animations for float/pulse. |
| Glass card component | Reusable `GlassCard` component with configurable blur, border, and glow levels. |
| Section wrapper | Reusable `LandingSection` component with consistent padding, max-width, fade-in animation via `IntersectionObserver`. |
| Footer | Minimal footer component. |

#### Phase 3: Content Sections (Days 3-4)

| Task | Deliverable |
|------|-------------|
| Hero section | Gradient text headline, sub-headline, dual CTAs, hero orbs. Full-viewport height. |
| Features section | 4-5 feature cards in a responsive grid. Lucide icons, glass styling. |
| How It Works section | 3-step layout with numbered indicators and connector lines. |
| Template preview section | Builder mockup/screenshot in a glass-framed container. |
| AI section | BYO API key explanation with feature list. |
| Trust section | 3-4 trust badges with icons and descriptions. |
| Final CTA section | Full-width gradient section with compelling copy and CTA button. |

#### Phase 4: Polish & Responsive (Day 5)

| Task | Deliverable |
|------|-------------|
| Scroll animations | `IntersectionObserver`-based fade-in for all sections. |
| Hover effects | Glass card glow and lift on hover. CTA button hover states. |
| Mobile responsive | Test and refine all breakpoints. Simplify glass effects on mobile. Mobile menu interactions. |
| Accessibility audit | Contrast checks, focus indicators, ARIA landmarks, skip-to-content link. Keyboard navigation through all interactive elements. |
| Performance audit | Lighthouse score check. Image optimization. Verify no builder JS leaks into landing page bundle. |
| SEO meta tags | Update `metadata` export with landing-page-specific title, description, OG tags. |

### 4.3 Future Iterations

| Iteration | Features |
|-----------|----------|
| **Post-MVP** | GitHub star count badge, typed text animation in hero, parallax orb effect |
| **v2.1** | Blog/changelog page, product updates section |
| **v2.2** | User showcase (with consent), embedded demo iframe |

---

## 5. Technical Considerations

### 5.1 Route Architecture

The route restructure is the most impactful technical change. Current state and target state:

```
CURRENT:
src/app/
  layout.tsx          -- Root layout with ALL providers (Resume, AI, ActiveSection, Toast)
  page.tsx            -- Builder page (client component)
  globals.css

TARGET:
src/app/
  layout.tsx          -- Root layout with MINIMAL providers (Toast only, or none)
  page.tsx            -- Landing page (server component, static)
  globals.css
  builder/
    layout.tsx        -- Builder layout wrapping ResumeProvider, AIProvider, ActiveSectionProvider
    page.tsx          -- Builder page (moved from root, client component)
```

**Key decisions:**

1. **Root layout becomes minimal.** The `ResumeProvider`, `AIProvider`, and `ActiveSectionProvider` are only needed by the builder. They must move to `src/app/builder/layout.tsx` so that the landing page does not load builder state or dependencies.

2. **`ToastProvider` placement.** If the landing page needs toast notifications (unlikely for MVP), keep `ToastProvider` in the root layout. Otherwise, move it to the builder layout as well. Recommendation: move it to builder layout for cleaner separation.

3. **Landing page is a server component.** No `'use client'` directive. This enables static rendering (SSG) and ensures zero client JS from the landing page itself. Interactive elements (mobile menu toggle, scroll observer) should be isolated in small client components.

4. **Font loading.** The `Inter` font is already configured in the root layout via `next/font/google`. This stays in the root layout so both the landing page and builder share the same font loading strategy.

### 5.2 Component Architecture

```
src/
  app/
    page.tsx                         -- Landing page (server component, assembles sections)
    builder/
      layout.tsx                     -- Builder providers wrapper
      page.tsx                       -- Builder page (moved from root)

  components/
    landing/
      Navbar.tsx                     -- Glassmorphism floating navbar (client component for mobile menu)
      HeroSection.tsx                -- Hero with gradient text, CTAs, orbs
      FeaturesSection.tsx            -- Feature cards grid
      HowItWorksSection.tsx          -- 3-step guide
      TemplatePreviewSection.tsx     -- Builder mockup showcase
      AISection.tsx                  -- BYO API key explanation
      TrustSection.tsx               -- Trust badges
      CTASection.tsx                 -- Final call-to-action
      Footer.tsx                     -- Minimal footer
      GlassCard.tsx                  -- Reusable glass card component
      BackgroundOrbs.tsx             -- Decorative animated gradient orbs
      SectionWrapper.tsx             -- Section container with fade-in animation (client component)
      MobileMenu.tsx                 -- Mobile hamburger menu (client component)
```

**Client vs. Server Component Strategy:**

| Component | Rendering | Reason |
|-----------|-----------|--------|
| `page.tsx` (landing) | Server | Static content, no interactivity, SSG |
| `Navbar.tsx` | Client | Mobile menu toggle state, scroll-based styling |
| `HeroSection.tsx` | Server | Static content |
| `FeaturesSection.tsx` | Server | Static content |
| `HowItWorksSection.tsx` | Server | Static content |
| `TemplatePreviewSection.tsx` | Server | Static content |
| `AISection.tsx` | Server | Static content |
| `TrustSection.tsx` | Server | Static content |
| `CTASection.tsx` | Server | Static content |
| `Footer.tsx` | Server | Static content |
| `SectionWrapper.tsx` | Client | `IntersectionObserver` for scroll animations |
| `MobileMenu.tsx` | Client | Open/close state |
| `BackgroundOrbs.tsx` | Server | Pure CSS animation, no JS needed |
| `GlassCard.tsx` | Server | Presentational only |

### 5.3 CSS Architecture

The landing page introduces a dark-themed visual system that is separate from the builder's light theme. To avoid conflicts:

1. **Scoping.** The landing page's dark styling is scoped to its own component tree. The builder retains its existing light theme. No global dark mode toggle is needed.

2. **New CSS custom properties.** Add landing-page-specific variables to `globals.css` under a clearly marked section, or create a co-located CSS module.

3. **Tailwind 4 approach.** The landing page primarily uses Tailwind utility classes with arbitrary values where needed (`bg-[#0A0E1A]`, `backdrop-blur-xl`, `border-white/10`). No Tailwind config changes required -- Tailwind 4's arbitrary value support covers all glassmorphism effects.

4. **Keyframe animations.** Define in `globals.css` under a `/* Landing Page Animations */` section:
   - `orb-float` -- slow vertical drift for background orbs
   - `orb-pulse` -- slow opacity/scale pulse for glow effect
   - `fade-up` -- section entrance animation (opacity 0 -> 1, translateY 20px -> 0)
   - `gradient-shift` -- optional slow gradient movement on hero background

### 5.4 Image / Asset Strategy

| Asset | Approach |
|-------|----------|
| Builder mockup screenshot | Static PNG/WebP image in `/public/images/`. Captured from the actual builder. Optimized and served via `<Image>`. |
| Lucide icons | Already in the project (`lucide-react`). Tree-shaken, no additional bundle cost. |
| Background orbs | Pure CSS (no images). Rendered with large `div` elements, `border-radius: 50%`, gradient backgrounds, and `filter: blur()`. |
| Logo | Reuse existing SVG (`src/app/icon.svg`) or render as text + icon. |

### 5.5 Bundle Isolation

Critical: the landing page must not import any builder dependencies. This is enforced by:

1. **Route-level code splitting.** Next.js App Router automatically splits by route. `src/app/page.tsx` and `src/app/builder/page.tsx` are separate entry points.
2. **No shared imports.** The `components/landing/` directory must not import from `components/editor/`, `components/preview/`, `components/ai/`, `components/templates/`, `hooks/`, `providers/`, or `lib/`.
3. **Verification.** After implementation, verify with `next build` that the landing page chunk does not include Tiptap, dnd-kit, or react-to-print.

### 5.6 SEO & Metadata

```typescript
// src/app/page.tsx (landing page metadata)
export const metadata: Metadata = {
  title: 'Resume AI APP -- Free AI-Powered Resume Builder | No Sign-Up Required',
  description:
    'Build professional resumes with a WYSIWYG editor, real-time preview, and optional AI suggestions. ' +
    'Free forever, no account needed. Export as PDF instantly.',
  openGraph: {
    title: 'Resume AI APP -- Free AI-Powered Resume Builder',
    description:
      'Build, preview, and export professional resumes as PDF. Optional AI-powered suggestions with your own API key. No sign-up required.',
    type: 'website',
    // TODO: Add OG image once available
  },
  keywords: [
    'resume builder',
    'AI resume',
    'free resume builder',
    'WYSIWYG resume editor',
    'PDF resume export',
    'no sign-up resume builder',
  ],
};
```

The builder page at `/builder` retains its existing metadata or gets a simplified version:

```typescript
// src/app/builder/page.tsx or layout.tsx
export const metadata: Metadata = {
  title: 'Resume Builder | Resume AI APP',
  description: 'Edit your resume with the Resume AI APP WYSIWYG builder.',
};
```

---

## 6. UX / Design Specification

### 6.1 Visual Design System

#### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--landing-bg-dark` | `#0A0E1A` | Page background (top) |
| `--landing-bg-mid` | `#1E1B4B` | Page background (bottom / gradient stop) |
| `--landing-accent-blue` | `#3B82F6` | Primary accent (CTAs, active states) |
| `--landing-accent-blue-light` | `#60A5FA` | Gradient end for blue accents |
| `--landing-accent-violet` | `#8B5CF6` | Secondary accent |
| `--landing-accent-violet-light` | `#A78BFA` | Gradient end for violet accents |
| `--landing-accent-cyan` | `#06B6D4` | Tertiary highlight / glow |
| `--landing-glass-bg` | `rgba(255,255,255,0.05)` | Glass surface base |
| `--landing-glass-bg-hover` | `rgba(255,255,255,0.10)` | Glass surface hover |
| `--landing-glass-border` | `rgba(255,255,255,0.10)` | Glass border |
| `--landing-glass-border-hover` | `rgba(255,255,255,0.20)` | Glass border hover |
| `--landing-text-heading` | `#F8FAFC` (slate-50) | Heading text |
| `--landing-text-body` | `#CBD5E1` (slate-300) | Body text |
| `--landing-text-muted` | `#94A3B8` (slate-400) | Secondary/muted text |

#### Typography Scale

| Element | Classes | Details |
|---------|---------|---------|
| Hero heading | `text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight` | Gradient text via `bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent` |
| Section heading | `text-3xl sm:text-4xl font-bold` | White (`text-slate-50`) |
| Section subheading | `text-lg sm:text-xl font-normal` | Slate-300 |
| Card title | `text-xl font-semibold` | White |
| Card body | `text-base font-normal` | Slate-300 |
| Navbar links | `text-sm font-medium` | Slate-300, white on hover |
| CTA button text | `text-base font-semibold` | White |

#### Glass Card Specification

```
Base:
  background: rgba(255, 255, 255, 0.05)
  backdrop-filter: blur(16px) saturate(180%)
  -webkit-backdrop-filter: blur(16px) saturate(180%)
  border: 1px solid rgba(255, 255, 255, 0.10)
  border-radius: 1rem (rounded-2xl)
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25)

Hover:
  background: rgba(255, 255, 255, 0.08)
  border-color: rgba(255, 255, 255, 0.20)
  box-shadow: 0 25px 50px -12px rgba(59, 130, 246, 0.15)
  transform: translateY(-2px)
  transition: all 0.3s ease

Fallback (no backdrop-filter support):
  background: rgba(15, 20, 40, 0.90)
```

#### Background Orbs Specification

| Orb | Size | Color | Position | Animation |
|-----|------|-------|----------|-----------|
| Orb 1 | 400-600px | `from-blue-500/30 to-transparent` | Top-right of hero | `orb-float` 20s ease-in-out infinite |
| Orb 2 | 300-500px | `from-violet-500/20 to-transparent` | Left of features section | `orb-float` 25s ease-in-out infinite reverse |
| Orb 3 | 350-550px | `from-cyan-500/20 to-transparent` | Right of AI section | `orb-pulse` 15s ease-in-out infinite |
| Orb 4 | 250-400px | `from-blue-600/15 to-transparent` | Bottom-left of CTA section | `orb-float` 30s ease-in-out infinite |

All orbs: `border-radius: 50%`, `filter: blur(80px)` to `blur(120px)`, `position: absolute`, `pointer-events: none`, `z-index: 0`.

#### CTA Button Specification

```
Primary CTA ("Start Building"):
  background: linear-gradient(135deg, #3B82F6, #8B5CF6)
  color: white
  padding: 0.875rem 2rem (py-3.5 px-8)
  border-radius: 0.75rem (rounded-xl)
  font-weight: 600
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.4)
  transition: all 0.3s ease

  Hover:
    box-shadow: 0 0 30px rgba(59, 130, 246, 0.6)
    transform: translateY(-1px)

  Active:
    transform: translateY(0)
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.3)
```

### 6.2 Section-by-Section Layout

#### Section 1: Navbar

```
+--[ 16px margin from viewport edges ]---------------------------------------+
|  +----------------------------------------------------------------------+  |
|  |  [Logo + "Resume AI APP"]    Features  How It Works  AI    [Start Building] |
|  +----------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------+

- Position: fixed, z-50
- Glass effect with backdrop-blur
- Rounded-2xl, mx-4, mt-4
- Logo: Lucide FileText icon in a small gradient square + "Resume AI APP" text
- Links scroll to corresponding section IDs
- CTA is a small gradient button
- Mobile: Hamburger icon toggles full-screen or slide-down menu
```

#### Section 2: Hero

```
min-h-screen, flex items-center justify-center

             [Decorative Orb: blue, top-right]

      Build Your Perfect Resume
           with AI

   "Create professional resumes with a powerful editor,
    real-time preview, and optional AI suggestions.
    Free forever. No sign-up required."

   [ Start Building ]    Learn More (scroll link)

             [Decorative Orb: violet, bottom-left]
```

#### Section 3: Features

```
py-24 to py-32

          "Everything You Need"
   "Powerful features to build the perfect resume"

   +----------------+  +----------------+  +----------------+
   |  [PenLine icon] |  | [Eye icon]     |  | [Sparkles icon]|
   |  WYSIWYG Editor |  | Real-Time      |  | AI Suggestions |
   |  Rich text with |  | Preview        |  | Get smart      |
   |  formatting,    |  | See changes    |  | improvements   |
   |  lists, links   |  | instantly as   |  | for your       |
   |                 |  | you type       |  | bullet points  |
   +----------------+  +----------------+  +----------------+

   +----------------+  +----------------+
   | [FileDown icon] |  | [UserX icon]   |
   | PDF Export      |  | No Sign-Up     |
   | Download your   |  | Start building |
   | resume as a     |  | immediately,   |
   | perfect PDF     |  | no account     |
   +----------------+  +----------------+

- 3 cards on first row, 2 centered on second row (desktop)
- 2-column on tablet, 1-column on mobile
- Each card is a GlassCard with hover glow
```

#### Section 4: How It Works

```
py-24 to py-32

              "How It Works"
       "Three steps to your next opportunity"

   (1)                  (2)                  (3)
   [MousePointerClick]  [FileEdit]           [Download]
   Open the Builder     Edit Your Resume     Export as PDF
   No sign-up needed.   Use the WYSIWYG      Download a
   Start building in    editor with real-     professional PDF
   seconds.             time preview.         ready to submit.

   --------[ connector line ]--------[ connector line ]--------

- Horizontal on desktop, vertical on mobile
- Numbered circles with gradient border
- Dashed connector lines between steps
- Each step in a glass container
```

#### Section 5: Template Preview

```
py-24 to py-32

          "See It in Action"
   "A powerful editor with real-time preview"

   +----------------------------------------------------+
   |  [Glass-framed browser mockup]                      |
   |  +------+-----------------------------------------+ |
   |  |Editor|        Preview                           | |
   |  |Panel |        Panel                             | |
   |  |      |                                          | |
   |  +------+-----------------------------------------+ |
   +----------------------------------------------------+

- Static image or CSS-rendered mock of the builder interface
- Glass frame with glow effect
- Optional: subtle "browser chrome" (dots, address bar) for realism
```

#### Section 6: AI Section

```
py-24 to py-32

          "Supercharge with AI"
   "Optional AI suggestions powered by your own API key"

   +--[Left: Description]------+  +--[Right: Visual]--------+
   |                            |  |                          |
   | AI that respects you:      |  |  [Mockup of AI panel    |
   |                            |  |   showing suggestion     |
   | [Check] Optional -- works  |  |   cards with Copy        |
   |         without it         |  |   buttons]               |
   | [Check] BYO API key --     |  |                          |
   |         no subscription    |  |                          |
   | [Check] Context-aware      |  |                          |
   |         suggestions        |  |                          |
   | [Check] One-click copy     |  |                          |
   |                            |  |                          |
   +----------------------------+  +--------------------------+

- 2-column layout (text + visual)
- Stacks vertically on mobile
- Checkmarks use Lucide Check icon with accent color
```

#### Section 7: Trust Section

```
py-24 to py-32

          "Built for Trust"
   "Your data, your control"

   +-------------+  +-------------+  +-------------+  +-------------+
   | [Heart icon] |  | [Shield icon]|  | [Github icon]|  | [Zap icon]  |
   | Free Forever |  | Privacy     |  | Open Source  |  | No Account  |
   |              |  | First       |  |              |  | Required    |
   | No hidden    |  | All data    |  | Transparent, |  | Start in    |
   | costs or     |  | stays in    |  | auditable    |  | seconds,    |
   | premium      |  | your        |  | code on      |  | zero        |
   | tiers.       |  | browser.    |  | GitHub.      |  | friction.   |
   +-------------+  +-------------+  +-------------+  +-------------+

- 4-column grid (2 on tablet, 1 on mobile)
- Glass cards with icon + title + description
- GitHub card links to the repository
```

#### Section 8: Final CTA

```
py-24 to py-32

   [Full-width section with stronger gradient background]

          "Ready to Build Your Resume?"
   "Join thousands of job seekers using Resume AI APP"

           [ Start Building Now ]

- Gradient background slightly different from page bg (more saturated)
- Large heading, compelling sub-text
- Single prominent CTA button
- Decorative orbs flanking the text
```

#### Section 9: Footer

```
py-8

   Resume AI APP                                 GitHub  |  Builder  |  Top

   (c) 2026 Resume AI APP. Free and open source.

- Simple horizontal layout
- Minimal links
- Muted text colors
- Subtle top border (border-white/5)
```

### 6.3 Responsive Breakpoints

| Breakpoint | Layout Changes |
|------------|---------------|
| `< 640px` (mobile) | Single-column everything. Navbar collapses to hamburger. Hero heading scales to `text-4xl`. Feature cards stack. How It Works steps stack vertically. Template preview image scales down. Section padding reduces to `py-16`. Background orbs: reduce count to 2, reduce size by 40%, reduce blur to `blur(60px)`. |
| `640px - 1023px` (tablet) | Feature cards in 2-column grid. How It Works steps in 3-column (tighter). Template preview image at 80% width. |
| `>= 1024px` (desktop) | Full layout as designed. All orbs active. Maximum padding. |

### 6.4 Interaction States

| Element | Default | Hover | Focus | Active |
|---------|---------|-------|-------|--------|
| Navbar link | `text-slate-300` | `text-white` | `ring-2 ring-blue-400 ring-offset-2 ring-offset-[#0A0E1A]` | `text-white` |
| CTA button | Gradient bg, glow shadow | Increased glow, `translateY(-1px)` | `ring-2 ring-blue-400 ring-offset-2 ring-offset-[#0A0E1A]` | `translateY(0)`, reduced glow |
| Glass card | Default glass styles | Brighter bg, brighter border, blue glow shadow, `translateY(-2px)` | `ring-2 ring-blue-400` | N/A |
| Footer link | `text-slate-400` | `text-slate-200` | `ring-2 ring-blue-400 ring-offset-2 ring-offset-[#0A0E1A]` | `text-white` |
| Mobile menu toggle | `text-slate-300` | `text-white` | `ring-2 ring-blue-400` | `text-white` |

---

## 7. Risks & Open Questions

### 7.1 Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| 1 | **`backdrop-filter` not supported in older browsers** | Low | Medium | Provide a fallback with solid semi-transparent background (`bg-[rgba(15,20,40,0.90)]`). Use `@supports` CSS rule. Safari has had `backdrop-filter` support since 2016; all major browsers support it. |
| 2 | **Performance degradation from blur effects on mobile** | Medium | Medium | Reduce blur values on mobile (`blur(40px)` instead of `blur(80-120px)`). Reduce orb count. Use `will-change: transform` sparingly. Profile with Chrome DevTools on low-end device simulation. |
| 3 | **Provider restructure breaks builder** | Low | High | Test builder at `/builder` thoroughly after moving providers. Ensure all hooks still resolve their contexts. Run the full builder flow (edit, save, export) after restructure. |
| 4 | **Landing page JS leaks into builder bundle (or vice versa)** | Low | Medium | Verify with `next build` output and bundle analyzer. Keep `components/landing/` completely isolated from builder code. No shared imports between landing and builder components. |
| 5 | **Glass text contrast fails accessibility** | Medium | High | Enforce minimum 4.5:1 contrast ratio for all text. Use `text-slate-50` for headings (passes on dark bg), `text-slate-300` for body (verify with contrast checker). Avoid placing text directly on glass cards without sufficient backdrop darkness. |
| 6 | **Template preview section looks empty without a real screenshot** | Medium | Low | For initial development, use a CSS-rendered mockup (colored rectangles simulating the editor/preview layout). Replace with a real screenshot once the builder UI is stable. |
| 7 | **Smooth scroll conflicts with fixed navbar** | Low | Low | Use `scroll-margin-top` or `scroll-padding-top` on section targets to account for navbar height. |

### 7.2 Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | Should the `ToastProvider` stay in the root layout or move to the builder layout? If it stays global, the landing page imports toast context unnecessarily. | Engineering | Open (recommend: move to builder layout) |
| 2 | Should we create a real screenshot of the builder or a CSS mockup for the template preview section? | Design | Open (recommend: CSS mockup for speed, real screenshot once builder is polished) |
| 3 | Do we want a GitHub repository link in the footer? If so, what is the canonical repo URL? | Product | Open |
| 4 | Should the navbar include a link to the GitHub repo alongside the builder CTA? | Product | Open (recommend: yes, small GitHub icon in navbar) |
| 5 | Should we add basic analytics (e.g., Plausible, Umami) to the landing page for tracking CTR? | Product | Open (recommend: defer to post-MVP) |
| 6 | What copy should the hero sub-headline use? Current placeholder is descriptive but may need marketing polish. | Product / Copy | Open |
| 7 | Should the landing page have a "Back to top" floating button or just the footer link? | Design | Open (recommend: footer link only for simplicity) |

---

## 8. Appendix

### 8.1 Lucide Icons Used

| Section | Icon | Import Name |
|---------|------|-------------|
| Navbar / Logo | File text icon | `FileText` |
| Feature: WYSIWYG Editor | Pen line icon | `PenLine` |
| Feature: Real-Time Preview | Eye icon | `Eye` |
| Feature: AI Suggestions | Sparkles icon | `Sparkles` |
| Feature: PDF Export | File download icon | `FileDown` |
| Feature: No Sign-Up | User X icon | `UserX` |
| How It Works: Step 1 | Mouse pointer click icon | `MousePointerClick` |
| How It Works: Step 2 | File edit icon | `FileEdit` |
| How It Works: Step 3 | Download icon | `Download` |
| AI Section: Checkmarks | Check icon | `Check` |
| Trust: Free Forever | Heart icon | `Heart` |
| Trust: Privacy | Shield icon | `Shield` |
| Trust: Open Source | GitHub icon | `Github` |
| Trust: No Account | Zap icon | `Zap` |
| Navbar: Mobile menu | Menu icon | `Menu` |
| Navbar: Mobile close | X icon | `X` |
| Footer: Arrow up | Arrow up icon | `ArrowUp` |

### 8.2 CSS Animation Keyframes

```css
/* Landing Page Animations */

@keyframes orb-float {
  0%, 100% {
    transform: translateY(0) translateX(0);
  }
  25% {
    transform: translateY(-30px) translateX(15px);
  }
  50% {
    transform: translateY(-15px) translateX(-10px);
  }
  75% {
    transform: translateY(-40px) translateX(20px);
  }
}

@keyframes orb-pulse {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.05);
  }
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes gradient-shift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}
```

### 8.3 IntersectionObserver Pattern for Scroll Animations

```typescript
// components/landing/SectionWrapper.tsx (client component)
'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface SectionWrapperProps {
  children: ReactNode;
  id?: string;
  className?: string;
}

export function SectionWrapper({ children, id, className }: SectionWrapperProps) {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el); // animate once only
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id={id}
      className={`transition-all duration-700 ease-out ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-6'
      } ${className ?? ''}`}
    >
      {children}
    </section>
  );
}
```

### 8.4 Glassmorphism Fallback Strategy

For browsers that do not support `backdrop-filter`:

```css
/* Feature detection with @supports */
.glass-card {
  /* Fallback: solid dark background */
  background: rgba(15, 20, 40, 0.90);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 1rem;
}

@supports (backdrop-filter: blur(16px)) {
  .glass-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
  }
}
```

### 8.5 Competitive Landing Pages (Reference)

| Product | Landing Page Style | Takeaway |
|---------|-------------------|----------|
| **Linear** | Dark, minimal, fast animations | Glassmorphism done well. Strong hero. Fast perceived performance. |
| **Vercel** | Dark gradient, glass cards, orbs | Similar aesthetic to our target. Good reference for orb placement and gradient usage. |
| **Raycast** | Dark, focused, command-palette hero | Clean section transitions. Good typography hierarchy. |
| **Supabase** | Dark green, glass elements | Good example of trust section and feature grid. |
| **Reactive Resume** | Light, functional | Our landing page should feel significantly more premium than this competitor. |

---

*End of document.*
