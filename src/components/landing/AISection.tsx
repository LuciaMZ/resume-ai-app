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
          <h2 className="text-3xl font-bold text-slate-50 sm:text-4xl">
            Supercharge with{' '}
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              AI
            </span>
          </h2>
          <p className="mt-4 text-lg text-slate-300 sm:text-xl">
            Optional AI suggestions powered by your own API key
          </p>
        </div>

        {/* Split Layout */}
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left: Description */}
          <div>
            <h3 className="mb-6 text-2xl font-semibold text-white">
              AI that respects you
            </h3>
            <div className="space-y-4">
              {aiBenefits.map((benefit, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 ring-1 ring-blue-400/30">
                    <benefit.icon className="h-3.5 w-3.5 text-blue-400" strokeWidth={2.5} />
                  </div>
                  <p className="text-base leading-relaxed text-slate-300">
                    {benefit.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Mock AI Panel */}
          <GlassCard hover={false} className="p-5">
            {/* Panel Header */}
            <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-500">
                <Sparkles className="h-4 w-4 text-white" strokeWidth={2} />
              </div>
              <span className="text-sm font-semibold text-white">
                AI Suggestions
              </span>
            </div>

            {/* Mock Suggestion Cards */}
            <div className="space-y-3">
              <MockSuggestionCard
                category="Rewrite"
                text="Led cross-functional team of 8 engineers to deliver microservices migration 3 weeks ahead of schedule, reducing API latency by 40%."
                gradient="from-blue-400/10 to-blue-400/5"
                borderColor="border-blue-400/20"
              />
              <MockSuggestionCard
                category="Quantify"
                text="Architected CI/CD pipeline handling 200+ daily deployments across 12 services, achieving 99.9% uptime SLA."
                gradient="from-violet-400/10 to-violet-400/5"
                borderColor="border-violet-400/20"
              />
              <MockSuggestionCard
                category="Action Verb"
                text="Spearheaded adoption of TypeScript across the frontend codebase, eliminating 60% of runtime errors within 6 months."
                gradient="from-cyan-400/10 to-cyan-400/5"
                borderColor="border-cyan-400/20"
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
  gradient,
  borderColor,
}: {
  category: string;
  text: string;
  gradient: string;
  borderColor: string;
}) {
  return (
    <div
      className={`rounded-xl border bg-gradient-to-br p-3 ${gradient} ${borderColor}`}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">{category}</span>
        <div className="flex h-6 w-6 items-center justify-center rounded-md border border-white/10 bg-white/5">
          <Copy className="h-3 w-3 text-slate-400" />
        </div>
      </div>
      <p className="text-sm leading-relaxed text-slate-200">{text}</p>
    </div>
  );
}
