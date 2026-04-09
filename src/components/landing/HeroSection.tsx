import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center px-4 pt-24 pb-16">
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-slate-300 backdrop-blur-sm">
          <span className="inline-block h-2 w-2 rounded-full bg-green-400" aria-hidden="true" />
          Free &amp; Open Source
        </div>

        {/* Headline */}
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
          <span className="text-white">Build Your Perfect Resume</span>
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
            with AI
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl">
          Create professional resumes with a powerful WYSIWYG editor, real-time preview,
          and optional AI suggestions. Free forever. No sign-up required.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/builder"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[#0A0E1A] active:translate-y-0 active:shadow-md"
          >
            Start Building Free
            <span aria-hidden="true">&rarr;</span>
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-8 py-4 text-base font-semibold text-slate-200 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[#0A0E1A]"
          >
            See How It Works
          </a>
        </div>

        {/* Decorative hint -- subtle scroll indicator */}
        <div className="mt-20 flex justify-center" aria-hidden="true">
          <div className="flex h-8 w-5 items-start justify-center rounded-full border border-white/20 p-1">
            <div
              className="h-2 w-1 rounded-full bg-white/40"
              style={{ animation: 'scroll-hint 2s ease-in-out infinite' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
