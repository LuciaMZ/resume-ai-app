import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center px-4 pt-24 pb-16">
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white/80 px-4 py-1.5 text-sm font-medium text-slate-700 backdrop-blur-sm">
          <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-accent)]" aria-hidden="true" />
          Free &amp; Open Source
        </div>

        {/* Headline */}
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
          <span className="text-[var(--color-primary)]">Build Your Perfect Resume</span>
          <br />
          <span className="text-[var(--color-secondary)]">
            with AI
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-700 sm:text-xl">
          Create professional resumes with a powerful WYSIWYG editor, real-time preview,
          and optional AI suggestions. Free forever. No sign-up required.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/builder"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-secondary)] px-8 py-4 text-base font-semibold text-white shadow-md shadow-blue-200/80 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-secondary-hover)] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg)] active:translate-y-0 active:shadow-md"
          >
            Start Building Free
            <span aria-hidden="true">&rarr;</span>
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-8 py-4 text-base font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg)]"
          >
            See How It Works
          </a>
        </div>

        {/* Decorative hint -- subtle scroll indicator */}
        <div className="mt-20 flex justify-center" aria-hidden="true">
          <div className="flex h-8 w-5 items-start justify-center rounded-full border border-[var(--color-border)] p-1">
            <div
              className="h-2 w-1 rounded-full bg-[var(--color-secondary)]/40"
              style={{ animation: 'scroll-hint 2s ease-in-out infinite' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
