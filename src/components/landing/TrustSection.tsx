import { Heart, Shield, Github, Zap } from 'lucide-react';
import { SectionWrapper } from './SectionWrapper';
import { GlassCard } from './GlassCard';

const trustItems = [
  {
    icon: Heart,
    title: 'Free Forever',
    description: 'No hidden costs, no premium tiers, no surprise paywalls. Every feature is free.',
    gradient: 'from-pink-400 to-rose-500',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'All data stays in your browser. Nothing is sent to any server except optional AI calls.',
    gradient: 'from-blue-400 to-blue-600',
  },
  {
    icon: Github,
    title: 'Open Source',
    description: 'Transparent, auditable code. Inspect, fork, or contribute on GitHub.',
    gradient: 'from-slate-300 to-slate-500',
    href: 'https://github.com/LuciaMZ/resume-ai-app',
  },
  {
    icon: Zap,
    title: 'No Account Required',
    description: 'Start in seconds. Zero friction -- no email, no password, no sign-up wall.',
    gradient: 'from-amber-400 to-orange-500',
  },
];

export function TrustSection() {
  return (
    <SectionWrapper id="trust" className="px-4 py-24 sm:py-32">
      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-slate-50 sm:text-4xl">
            Built for Trust
          </h2>
          <p className="mt-4 text-lg text-slate-300 sm:text-xl">
            Your data, your control
          </p>
        </div>

        {/* Trust Badges Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item) => {
            const cardProps = item.href
              ? { as: 'a' as const, href: item.href, target: '_blank', rel: 'noopener noreferrer' }
              : {};

            return (
              <GlassCard
                key={item.title}
                className="text-center"
                {...cardProps}
              >
                <div
                  className={`mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} shadow-lg`}
                >
                  <item.icon className="h-6 w-6 text-white" strokeWidth={1.8} />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-300">
                  {item.description}
                </p>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </SectionWrapper>
  );
}
