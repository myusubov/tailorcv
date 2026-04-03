'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  FileText,
  Sparkles,
  Download,
  Zap,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { GithubIcon } from '../icons/brand-icons';
import Link from 'next/link';

const steps = [
  {
    icon: GithubIcon,
    number: '01',
    title: 'Connect GitHub',
    description:
      'Link your GitHub account in one click. We automatically import your projects and skills.',
    color: 'from-violet-500 to-purple-600',
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-500',
  },
  {
    icon: FileText,
    number: '02',
    title: 'Paste Job Description',
    description:
      'Copy and paste the job posting. Our AI analyzes requirements instantly.',
    color: 'from-blue-500 to-cyan-600',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
  },
  {
    icon: Sparkles,
    number: '03',
    title: 'AI Customizes Everything',
    description:
      'Watch as AI tailors your resume to match the job perfectly. Keywords, skills, achievements.',
    color: 'from-amber-500 to-orange-600',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
  },
  {
    icon: Download,
    number: '04',
    title: 'Download Perfect PDF',
    description:
      'Get your ATS-friendly resume in seconds. Ready to submit and land that interview.',
    color: 'from-emerald-500 to-green-600',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' as const },
  },
};

function StepCard({ step, index }: { step: (typeof steps)[0]; index: number }) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="group relative"
    >
      {/* Connector line (except last) */}
      {index < steps.length - 1 && (
        <div className="absolute top-12 left-full z-0 hidden h-0.5 w-full bg-gradient-to-r from-zinc-700 to-transparent lg:block" />
      )}

      {/* Card */}
      <div className="border-landing-border from-card-gradient-from to-card-gradient-to hover:border-landing-border-muted relative h-full rounded-2xl border bg-gradient-to-br p-6 transition-all duration-300 lg:p-8">
        {/* Glow effect on hover */}
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.color} opacity-0 transition-opacity duration-300 group-hover:opacity-5`}
        />

        {/* Step number */}
        <div className="mb-6 flex items-center justify-between">
          <span className="text-landing-text-muted font-mono text-xs tracking-wider uppercase">
            Step {step.number}
          </span>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + index * 0.1, type: 'spring' }}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </motion.div>
        </div>

        {/* Icon */}
        <motion.div
          whileHover={{
            rotate: [0, -10, 10, 0],
            transition: { duration: 0.5 },
          }}
          className={`h-14 w-14 rounded-xl ${step.iconBg} mb-5 flex items-center justify-center`}
        >
          <step.icon className={`h-7 w-7 ${step.iconColor}`} />
        </motion.div>

        {/* Content */}
        <h3 className="text-landing-text mb-3 text-xl font-semibold transition-all group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-zinc-400 group-hover:bg-clip-text group-hover:text-transparent">
          {step.title}
        </h3>
        <p className="text-landing-text-muted text-sm leading-relaxed">
          {step.description}
        </p>
      </div>
    </motion.div>
  );
}

export function SolutionSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="bg-landing-bg relative overflow-hidden py-24 lg:py-32"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/5 to-transparent" />

      {/* Decorative elements */}
      <div className="absolute top-1/4 left-0 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="absolute right-0 bottom-1/4 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          {/* Label */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={
              isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }
            }
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2"
          >
            <Zap className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-medium tracking-wider text-emerald-500 uppercase">
              The New Way
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-landing-text mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl"
          >
            4 Simple Steps.{' '}
            <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
              30 Seconds Total.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-landing-text-muted mx-auto max-w-2xl text-lg"
          >
            No more copy-pasting. No more formatting headaches. Just connect,
            paste, and download.
          </motion.p>
        </motion.div>

        {/* Steps grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="mb-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-4"
        >
          {steps.map((step, index) => (
            <StepCard key={step.number} step={step} index={index} />
          ))}
        </motion.div>

        {/* Stats card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="relative mx-auto max-w-2xl"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 blur-3xl" />

          {/* Card */}
          <div className="from-card-gradient-from to-card-gradient-to relative rounded-2xl border border-emerald-500/20 bg-gradient-to-br p-8 text-center">
            <div className="mb-4 flex items-center justify-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  type: 'tween',
                  duration: 20,
                  repeat: 9999,
                  ease: 'linear',
                }}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10"
              >
                <Zap className="h-6 w-6 text-emerald-500" />
              </motion.div>
            </div>

            <div className="text-landing-text mb-2 text-5xl font-bold lg:text-6xl">
              <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                30 seconds
              </span>
            </div>
            <p className="text-landing-text-muted mb-6 text-xl">
              That&apos;s{' '}
              <span className="font-semibold text-emerald-500">30x faster</span>{' '}
              than the manual way
            </p>

            {/* CTA */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/register"
                className="group text-landing-text inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-600 px-8 py-4 text-base font-semibold shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40"
              >
                Try It Free
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
