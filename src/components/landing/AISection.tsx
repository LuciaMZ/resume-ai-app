import { Check, Sparkles, Copy, Lightbulb, Key } from 'lucide-react';
import { SectionWrapper } from './SectionWrapper';
import { GlassCard } from './GlassCard';

const aiBenefits = [
  {
    icon: Check,
    text: 'Completely optional -- the builder works perfectly without it',
  },
  {
    icon: Key,
    text: 'Bring your own OpenAI API key -- no subscription, no vendor lock-in',
  },
  {
    icon: Lightbulb,
    text: 'Context-aware suggestions based on the section you are editing',
  },
  {
    icon: Copy,
    text: 'One-click copy to clipboard -- paste improvements directly into your resume',
  },
];

export function AISection() {
  return (
    <SectionWrapper id="ai" className="px-4 py-24 sm:py-32">
      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-[var(--color-primary)] sm:text-4xl">
            Supercharge with{' '}
            <span className="text-[var(--color-secondary)]">
              AI
            </span>
          </h2>
          <p className="mt-4 text-lg text-slate-600 sm:text-xl">
            Optional AI suggestions powered by your own API key
          </p>
        </div>

        {/* Split Layout */}
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left: Description */}
          <div>
            <h3 className="mb-6 text-2xl font-semibold text-[var(--color-primary)]">
              AI that respects you
            </h3>
            <div className="space-y-4">
              {aiBenefits.map((benefit, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-1 ${
                    i % 2 === 0
                      ? 'bg-[var(--color-secondary)]/10 ring-[var(--color-secondary)]/25'
                      : 'bg-[var(--color-accent)]/10 ring-[var(--color-accent)]/25'
                  }`}>
                    <benefit.icon
                      className={`h-3.5 w-3.5 ${
                        i % 2 === 0 ? 'text-[var(--color-secondary)]' : 'text-[var(--color-accent)]'
                      }`}
                      strokeWidth={2.5}
                    />
                  </div>
                  <p className="text-base leading-relaxed text-slate-700">
                    {benefit.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Mock AI Panel */}
          <GlassCard hover={false} className="p-5">
            {/* Panel Header */}
            <div className="mb-4 flex items-center gap-2 border-b border-[var(--color-border)] pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-secondary)]">
                <Sparkles className="h-4 w-4 text-white" strokeWidth={2} />
              </div>
              <span className="text-sm font-semibold text-[var(--color-primary)]">
                AI Suggestions
              </span>
            </div>

            {/* Mock Suggestion Cards */}
            <div className="space-y-3">
              <MockSuggestionCard
                category="Rewrite"
                text="Led cross-functional team of 8 engineers to deliver microservices migration 3 weeks ahead of schedule, reducing API latency by 40%."
                tone="secondary"
              />
              <MockSuggestionCard
                category="Quantify"
                text="Architected CI/CD pipeline handling 200+ daily deployments across 12 services, achieving 99.9% uptime SLA."
                tone="accent"
              />
              <MockSuggestionCard
                category="Action Verb"
                text="Spearheaded adoption of TypeScript across the frontend codebase, eliminating 60% of runtime errors within 6 months."
                tone="secondary"
              />
            </div>
          </GlassCard>
        </div>
      </div>
    </SectionWrapper>
  );
}

function MockSuggestionCard({
  category,
  text,
  tone,
}: {
  category: string;
  text: string;
  tone: 'secondary' | 'accent';
}) {
  const surfaceClass =
    tone === 'secondary'
      ? 'border-[var(--color-secondary)]/20 bg-[var(--color-secondary)]/5'
      : 'border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5';

  const iconClass =
    tone === 'secondary' ? 'text-[var(--color-secondary)]' : 'text-[var(--color-accent)]';

  return (
    <div
      className={`rounded-xl border p-3 ${surfaceClass}`}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{category}</span>
        <div className="flex h-6 w-6 items-center justify-center rounded-md border border-[var(--color-border)] bg-white">
          <Copy className={`h-3 w-3 ${iconClass}`} />
        </div>
      </div>
      <p className="text-sm leading-relaxed text-slate-700">{text}</p>
    </div>
  );
}
