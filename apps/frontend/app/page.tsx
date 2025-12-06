import { Metadata } from 'next';
import {
  Navigation,
  Hero,
  ProblemSection,
  SolutionSection,
  GithubFeature,
  FeaturesGrid,
  Testimonials,
  Pricing,
  FAQ,
  FinalCTA,
  Footer,
} from './components/landing';

export const metadata: Metadata = {
  title: 'TailorCV - Tailor Your Resume for Any Job in 30 Seconds',
  description:
    'Stop wasting hours on ChatGPT. Connect GitHub, paste job description, download perfect resume. Built specifically for developers.',
  keywords: [
    'resume builder',
    'CV builder',
    'developer resume',
    'AI resume',
    'GitHub resume',
    'ATS friendly resume',
    'job application',
    'tech resume',
  ],
  openGraph: {
    title: 'TailorCV - Tailor Your Resume for Any Job in 30 Seconds',
    description:
      'Stop wasting hours on ChatGPT. Connect GitHub, paste job description, download perfect resume.',
    type: 'website',
    url: 'https://tailorcv.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TailorCV - Tailor Your Resume for Any Job in 30 Seconds',
    description:
      'Stop wasting hours on ChatGPT. Connect GitHub, paste job description, download perfect resume.',
  },
};

export default function LandingPage() {
  return (
    <main className="bg-landing-bg text-landing-text relative min-h-screen antialiased">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <Hero />

      {/* Problem Section - The Old Way */}
      <ProblemSection />

      {/* Solution Section - The New Way */}
      <SolutionSection />

      {/* GitHub Feature Highlight */}
      <GithubFeature />

      {/* Features Grid */}
      <FeaturesGrid />

      {/* Testimonials */}
      <Testimonials />

      {/* Pricing */}
      <Pricing />

      {/* FAQ */}
      <FAQ />

      {/* Final CTA */}
      <FinalCTA />

      {/* Footer */}
      <Footer />
    </main>
  );
}
