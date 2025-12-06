'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  Play,
  Sparkles,
  Github,
  FileText,
  Download,
} from 'lucide-react';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' as const },
  },
};

// Floating orb component
function FloatingOrb({
  className,
  delay = 0,
}: {
  className: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0.4, 0.8, 0.4],
        scale: [1, 1.2, 1],
        x: [0, 30, 0],
        y: [0, -30, 0],
      }}
      transition={{
        type: 'tween',
        duration: 10,
        repeat: 9999,
        repeatType: 'reverse',
        delay,
        ease: 'easeInOut',
      }}
      className={`absolute rounded-full blur-3xl ${className}`}
    />
  );
}

// Animated mockup component
function AnimatedMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6 }}
      className="relative mt-16 lg:mt-0"
    >
      {/* Glow effect behind mockup */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-3xl" />

      {/* Mockup container */}
      <div className="bg-surface border-landing-border relative rounded-2xl border p-1 shadow-2xl shadow-indigo-500/10">
        <div className="bg-code-bg overflow-hidden rounded-xl">
          {/* Browser header */}
          <div className="border-landing-border flex items-center gap-2 border-b px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500/80" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <div className="h-3 w-3 rounded-full bg-green-500/80" />
            </div>
            <div className="flex-1 text-center">
              <span className="text-landing-text-muted text-xs">
                tailorcv.app
              </span>
            </div>
          </div>

          {/* App content */}
          <div className="space-y-4 p-6">
            {/* Step indicators */}
            <div className="mb-6 flex items-center justify-center gap-4">
              {[
                { icon: Github, label: 'GitHub', active: true },
                { icon: FileText, label: 'Job', active: true },
                { icon: Sparkles, label: 'AI', active: true },
                { icon: Download, label: 'PDF', active: false },
              ].map((step, i) => (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 + i * 0.15 }}
                  className="flex flex-col items-center gap-1"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      step.active
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                        : 'bg-surface-secondary text-landing-text-muted'
                    }`}
                  >
                    <step.icon size={18} />
                  </div>
                  <span className="text-landing-text-muted text-[10px]">
                    {step.label}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* AI Processing animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="bg-surface-secondary border-landing-border rounded-lg border p-4"
            >
              <div className="mb-3 flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    type: 'tween',
                    duration: 2,
                    repeat: 9999,
                    ease: 'linear',
                  }}
                >
                  <Sparkles className="h-5 w-5 text-indigo-500" />
                </motion.div>
                <span className="text-landing-text-secondary text-sm">
                  AI is tailoring your resume...
                </span>
              </div>
              <div className="space-y-2">
                {[
                  'Analyzing job requirements',
                  'Matching your skills',
                  'Optimizing keywords',
                ].map((text, i) => (
                  <motion.div
                    key={text}
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ delay: 1.8 + i * 0.3, duration: 0.8 }}
                    className="h-2 rounded-full bg-gradient-to-r from-indigo-500/50 to-purple-500/50"
                    style={{ maxWidth: `${100 - i * 15}%` }}
                  />
                ))}
              </div>
            </motion.div>

            {/* Preview cards */}
            <div className="grid grid-cols-2 gap-3">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2.5 }}
                className="bg-surface-secondary border-landing-border rounded-lg border p-3"
              >
                <div className="bg-muted mb-2 h-2 w-full rounded" />
                <div className="bg-muted mb-2 h-2 w-3/4 rounded" />
                <div className="bg-muted h-2 w-1/2 rounded" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2.7 }}
                className="bg-surface-secondary border-landing-border rounded-lg border p-3"
              >
                <div className="mb-2 h-2 w-full rounded bg-indigo-500/50" />
                <div className="mb-2 h-2 w-3/4 rounded bg-purple-500/50" />
                <div className="h-2 w-1/2 rounded bg-pink-500/50" />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function Hero() {
  return (
    <section className="bg-landing-bg relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
      {/* Floating gradient orbs */}
      <FloatingOrb
        className="bg-orb-indigo -top-48 -left-48 h-[500px] w-[500px]"
        delay={0}
      />
      <FloatingOrb
        className="bg-orb-purple top-1/4 right-0 h-[400px] w-[400px]"
        delay={2}
      />
      <FloatingOrb
        className="bg-orb-pink bottom-0 left-1/4 h-[300px] w-[300px]"
        delay={4}
      />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(var(--landing-text) 1px, transparent 1px),
            linear-gradient(90deg, var(--landing-text) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left column - Text content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div variants={itemVariants} className="mb-6 inline-block">
              <motion.div
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ type: 'tween', duration: 2, repeat: 9999 }}
                className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-4 py-2"
              >
                <span className="text-lg">🚀</span>
                <span className="text-sm font-medium text-indigo-500">
                  200+ developers using TailorCV
                </span>
              </motion.div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-landing-text text-4xl leading-[1.1] font-bold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl"
            >
              Tailor Your CV for Any Job in{' '}
              <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                30 Seconds
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={itemVariants}
              className="text-landing-text-muted mx-auto mt-6 max-w-xl text-lg sm:text-xl lg:mx-0"
            >
              Stop wasting hours on ChatGPT. Connect GitHub, paste job
              description, download perfect resume.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={itemVariants}
              className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/register"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40"
                >
                  Start Free (3 resumes)
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </motion.div>

              <motion.a
                href="#how-it-works"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border-landing-border bg-surface text-landing-text-secondary hover:bg-surface-secondary hover:text-landing-text inline-flex items-center justify-center gap-2 rounded-full border px-6 py-4 text-base font-medium transition-all"
              >
                <Play size={18} className="text-indigo-500" />
                See How It Works
              </motion.a>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              variants={itemVariants}
              className="text-landing-text-muted mt-10 flex items-center justify-center gap-6 text-sm lg:justify-start"
            >
              <div className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Free tier forever</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right column - Animated mockup */}
          <AnimatedMockup />
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="from-landing-bg absolute right-0 bottom-0 left-0 h-32 bg-gradient-to-t to-transparent" />
    </section>
  );
}
