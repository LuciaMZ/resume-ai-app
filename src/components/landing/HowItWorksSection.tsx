import { MousePointerClick, FileEdit, Download } from 'lucide-react';
import { SectionWrapper } from './SectionWrapper';
import { GlassCard } from './GlassCard';

const steps = [
  {
    number: 1,
    icon: MousePointerClick,
    title: 'Open the Builder',
    description:
      'No sign-up needed. Click "Start Building" and you are in the editor in seconds.',
    gradient: 'from-blue-400 to-blue-600',
  },
  {
    number: 2,
    icon: FileEdit,
    title: 'Edit Your Resume',
    description:
      'Use the WYSIWYG editor to fill in your details. See a real-time preview as you type.',
    gradient: 'from-violet-400 to-violet-600',
  },
  {
    number: 3,
    icon: Download,
    title: 'Export as PDF',
    description:
      'Download a professional, print-ready PDF. Ready to submit to any job application.',
    gradient: 'from-cyan-400 to-cyan-600',
  },
];

export function HowItWorksSection() {
  return (
    <SectionWrapper id="how-it-works" className="px-4 py-24 sm:py-32">
      <div className="relative z-10 mx-auto max-w-5xl">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-slate-50 sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-slate-300 sm:text-xl">
            Three steps to your next opportunity
          </p>
        </div>

        {/* Steps */}
        <div className="relative grid gap-8 md:grid-cols-3 md:gap-6">
          {/* Connector lines (desktop only) */}
          <div className="absolute top-16 right-0 left-0 hidden md:block" aria-hidden="true">
            <div className="mx-auto flex max-w-[66%] items-center justify-between">
              <div className="h-px flex-1 bg-gradient-to-r from-blue-500/40 to-violet-500/40" />
              <div className="h-px flex-1 bg-gradient-to-r from-violet-500/40 to-cyan-500/40" />
            </div>
          </div>

          {steps.map((step) => (
            <div key={step.number} className="relative flex flex-col items-center text-center">
              {/* Step Number Badge */}
              <div className="relative z-10 mb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/20 bg-[#0A0E1A] text-lg font-bold text-white shadow-lg shadow-blue-500/10">
                  {step.number}
                </div>
              </div>

              {/* Vertical connector (mobile only) */}
              {step.number < 3 && (
                <div
                  className="absolute left-1/2 top-[4.5rem] h-8 w-px -translate-x-1/2 bg-gradient-to-b from-white/20 to-transparent md:hidden"
                  aria-hidden="true"
                />
              )}

              {/* Card */}
              <GlassCard className="w-full" hover={false}>
                <div
                  className={`mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${step.gradient} shadow-lg`}
                >
                  <step.icon className="h-6 w-6 text-white" strokeWidth={1.8} />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-white">
                  {step.title}
                </h3>
                <p className="text-base leading-relaxed text-slate-300">
                  {step.description}
                </p>
              </GlassCard>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
