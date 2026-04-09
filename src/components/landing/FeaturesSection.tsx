import { PenLine, Eye, Sparkles, FileDown, UserX } from 'lucide-react';
import { SectionWrapper } from './SectionWrapper';
import { GlassCard } from './GlassCard';

const features = [
  {
    icon: PenLine,
    title: 'WYSIWYG Editor',
    description:
      'Rich text editing with bold, italic, lists, and links. Format your resume content exactly how you want it.',
    gradient: 'from-blue-400 to-blue-600',
  },
  {
    icon: Eye,
    title: 'Real-Time Preview',
    description:
      'See every change instantly as you type. The live preview updates in real time, so what you see is what you get.',
    gradient: 'from-violet-400 to-violet-600',
  },
  {
    icon: Sparkles,
    title: 'AI Suggestions',
    description:
      'Get smart, contextual improvements for your bullet points. Powered by your own OpenAI API key -- no subscription needed.',
    gradient: 'from-cyan-400 to-cyan-600',
  },
  {
    icon: FileDown,
    title: 'PDF Export',
    description:
      'Download your finished resume as a pixel-perfect PDF, ready to submit to any job application.',
    gradient: 'from-blue-400 to-violet-500',
  },
  {
    icon: UserX,
    title: 'No Sign-Up Needed',
    description:
      'Start building immediately. No account, no email, no friction. Your data stays in your browser.',
    gradient: 'from-violet-400 to-cyan-500',
  },
];

export function FeaturesSection() {
  return (
    <SectionWrapper id="features" className="px-4 py-24 sm:py-32">
      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-slate-50 sm:text-4xl">
            Everything You Need
          </h2>
          <p className="mt-4 text-lg text-slate-300 sm:text-xl">
            Powerful features to build the perfect resume
          </p>
        </div>

        {/* Feature Cards -- top row of 3 */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.slice(0, 3).map((feature) => (
            <GlassCard key={feature.title}>
              <div
                className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg`}
              >
                <feature.icon className="h-6 w-6 text-white" strokeWidth={1.8} />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">
                {feature.title}
              </h3>
              <p className="text-base leading-relaxed text-slate-300">
                {feature.description}
              </p>
            </GlassCard>
          ))}
        </div>

        {/* Feature Cards -- bottom row of 2, centered on desktop */}
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:mx-auto lg:max-w-[calc(66.666%+0.75rem)] lg:grid-cols-2">
          {features.slice(3).map((feature) => (
            <GlassCard key={feature.title}>
              <div
                className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg`}
              >
                <feature.icon className="h-6 w-6 text-white" strokeWidth={1.8} />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">
                {feature.title}
              </h3>
              <p className="text-base leading-relaxed text-slate-300">
                {feature.description}
              </p>
            </GlassCard>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
