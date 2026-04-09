import Link from 'next/link';
import { SectionWrapper } from './SectionWrapper';

export function CTASection() {
  return (
    <SectionWrapper className="px-4 py-24 sm:py-32">
      <div className="relative z-10 mx-auto max-w-4xl">
        {/* CTA Card with stronger glow */}
        <div className="glass-card relative overflow-hidden rounded-3xl border border-white/10 px-6 py-16 text-center sm:px-12 sm:py-20">
          {/* Background gradient inside the card */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(59,130,246,0.3) 0%, rgba(139,92,246,0.15) 50%, transparent 80%)',
            }}
            aria-hidden="true"
          />

          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              Ready to Build Your Resume?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
              Join thousands of job seekers creating professional resumes with
              Resume AI APP. Free, private, and powered by you.
            </p>
            <div className="mt-10">
              <Link
                href="/builder"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-500 px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-violet-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[#0A0E1A] active:translate-y-0 active:shadow-md"
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
