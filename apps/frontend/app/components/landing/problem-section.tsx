'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  MessageSquare,
  Copy,
  FileText,
  ClipboardPaste,
  Clock,
  ClipboardCheck,
  Wrench,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

const painfulSteps = [
  { icon: MessageSquare, label: 'Open ChatGPT', color: 'text-red-400' },
  { icon: Copy, label: 'Copy your resume', color: 'text-orange-400' },
  { icon: FileText, label: 'Copy job description', color: 'text-yellow-400' },
  { icon: ClipboardPaste, label: 'Paste both', color: 'text-lime-400' },
  { icon: Clock, label: 'Wait for response', color: 'text-green-400' },
  { icon: ClipboardCheck, label: 'Copy output', color: 'text-teal-400' },
  { icon: Wrench, label: 'Fix formatting', color: 'text-cyan-400' },
  { icon: RefreshCw, label: 'Repeat 50-100 times', color: 'text-red-500' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
};

function AnimatedCounter({
  value,
  suffix = '',
  prefix = '',
}: {
  value: number;
  suffix?: string;
  prefix?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      className="tabular-nums"
    >
      {prefix}
      <motion.span
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {isInView ? value : 0}
      </motion.span>
      {suffix}
    </motion.span>
  );
}

export function ProblemSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section
      ref={sectionRef}
      className="bg-landing-bg relative overflow-hidden py-24 lg:py-32"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-red-950/10 via-transparent to-transparent" />

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
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2"
          >
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-sm font-medium tracking-wider text-red-400 uppercase">
              The Old Way
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-landing-text mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl"
          >
            The Manual Resume <span className="text-red-400">Hell</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-landing-text-muted mx-auto max-w-2xl text-lg"
          >
            Sound familiar? This is what every developer goes through for each
            job application.
          </motion.p>
        </motion.div>

        {/* Two columns layout */}
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: Steps list */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className="relative"
          >
            {/* Vertical line connector */}
            <div className="absolute top-8 bottom-8 left-6 w-0.5 bg-gradient-to-b from-red-500/50 via-yellow-500/50 to-red-500/50" />

            <div className="space-y-4">
              {painfulSteps.map((step, index) => (
                <motion.div
                  key={step.label}
                  variants={itemVariants}
                  className="group relative flex items-center gap-4"
                >
                  {/* Step number circle */}
                  <div className="border-landing-border bg-surface group-hover:border-landing-border-muted relative z-10 flex h-12 w-12 items-center justify-center rounded-full border transition-colors">
                    <step.icon className={`h-5 w-5 ${step.color}`} />
                  </div>

                  {/* Step content */}
                  <div className="border-landing-border/50 bg-surface/50 group-hover:border-landing-border-muted/50 flex-1 rounded-lg border px-4 py-3 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-landing-text-secondary font-medium">
                        {step.label}
                      </span>
                      <span className="text-landing-text-muted text-xs">
                        Step {index + 1}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Stats card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 blur-3xl" />

            {/* Card */}
            <div className="from-card-gradient-from to-card-gradient-to relative rounded-2xl border border-red-500/20 bg-gradient-to-br p-8 lg:p-10">
              {/* Warning icon */}
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{
                  type: 'tween',
                  duration: 2,
                  repeat: 9999,
                  repeatDelay: 3,
                }}
                className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10"
              >
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </motion.div>

              {/* Main stat */}
              <div className="mb-6">
                <div className="text-landing-text mb-2 text-5xl font-bold lg:text-6xl">
                  <AnimatedCounter value={15} />-
                  <AnimatedCounter value={20} suffix=" min" />
                </div>
                <p className="text-landing-text-muted text-lg">
                  Per job application
                </p>
              </div>

              {/* Calculation */}
              <div className="border-landing-border/50 bg-surface/50 mb-6 rounded-lg border p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-landing-text-muted">
                    Time per application
                  </span>
                  <span className="text-landing-text-secondary">~20 min</span>
                </div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-landing-text-muted">
                    Applications needed
                  </span>
                  <span className="text-landing-text-secondary">×50-100</span>
                </div>
                <div className="bg-surface-secondary my-3 h-px" />
                <div className="flex items-center justify-between">
                  <span className="text-landing-text-muted font-medium">
                    Total time wasted
                  </span>
                  <span className="text-lg font-bold text-red-400">
                    <AnimatedCounter value={12} />-
                    <AnimatedCounter value={33} suffix=" hours" />
                  </span>
                </div>
              </div>

              {/* Quote */}
              <p className="text-landing-text-muted border-l-2 border-red-500/50 pl-4 text-sm italic">
                &ldquo;I spent more time customizing resumes than actually
                preparing for interviews.&rdquo;
                <span className="text-landing-text-muted mt-1 block not-italic">
                  — Every developer ever
                </span>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
