import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { TemplatePreviewSection } from '@/components/landing/TemplatePreviewSection';
import { AISection } from '@/components/landing/AISection';
import { TrustSection } from '@/components/landing/TrustSection';
import { CTASection } from '@/components/landing/CTASection';
import { Footer } from '@/components/landing/Footer';
import { BackgroundOrbs } from '@/components/landing/BackgroundOrbs';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#0A0E1A] text-white">
      {/* Skip to content link for accessibility */}
      <a
        href="#features"
        className="fixed top-0 left-0 z-[100] -translate-y-full rounded-br-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>

      {/* Background */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: 'linear-gradient(180deg, #0A0E1A 0%, #1E1B4B 50%, #0A0E1A 100%)',
        }}
        aria-hidden="true"
      />
      <BackgroundOrbs />

      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TemplatePreviewSection />
        <AISection />
        <TrustSection />
        <CTASection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
