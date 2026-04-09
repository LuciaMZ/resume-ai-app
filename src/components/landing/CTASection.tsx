import Link from 'next/link';
import { SectionWrapper } from './SectionWrapper';

export function CTASection() {
  return (
    <SectionWrapper className="px-4 py-24 sm:py-32">
      <div className="relative z-10 mx-auto max-w-4xl">
        {/* CTA Card with stronger glow */}
        <div className="glass-card relative overflow-hidden rounded-3xl border border-[var(--color-border)] px-6 py-16 text-center sm:px-12 sm:py-20">
          {/* Background gradient inside the card */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(37,99,235,0.12) 0%, rgba(20,184,166,0.1) 55%, transparent 85%)',
            }}
            aria-hidden="true"
          />

          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-[var(--color-primary)] sm:text-4xl lg:text-5xl">
              Ready to Build Your Resume?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate-700">
              Join thousands of job seekers creating professional resumes with
              Resume AI APP. Free, private, and powered by you.
            </p>
            <div className="mt-10">
              <Link
                href="/builder"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-secondary)] px-10 py-4 text-lg font-semibold text-white shadow-md shadow-blue-200/80 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-secondary-hover)] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg)] active:translate-y-0 active:shadow-md"
              >
                Start Building Now
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
