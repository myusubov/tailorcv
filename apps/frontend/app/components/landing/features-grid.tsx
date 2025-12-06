'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Sparkles,
  FileCheck2,
  History,
  Github,
  ListTodo,
  Download,
  Zap,
} from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'AI Customization',
    description:
      'Tailored to each job in seconds. Our AI rewrites your experience to match job requirements perfectly.',
    gradient: 'from-violet-500 to-purple-600',
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-500',
  },
  {
    icon: FileCheck2,
    title: 'ATS-Friendly PDFs',
    description:
      'Pass applicant tracking systems with ease. Clean formatting that both robots and humans love.',
    gradient: 'from-emerald-500 to-green-600',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
  },
  {
    icon: History,
    title: 'Version History',
    description:
      'Track every customization. Never lose a version and easily compare changes across applications.',
    gradient: 'from-blue-500 to-cyan-600',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
  },
  {
    icon: Github,
    title: 'GitHub Integration',
    description:
      'Auto-import your work. Connect once and we pull your projects, languages, and contributions.',
    gradient: 'from-zinc-400 to-zinc-600',
    iconBg: 'bg-muted',
    iconColor: 'text-landing-text-muted',
  },
  {
    icon: ListTodo,
    title: 'Application Tracker',
    description:
      'Organize your job search. Track applications, interviews, and follow-ups in one place.',
    gradient: 'from-amber-500 to-orange-600',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
  },
  {
    icon: Download,
    title: 'One-Click Download',
    description:
      'Instant professional PDFs. Export your tailored resume with a single click, ready to submit.',
    gradient: 'from-pink-500 to-rose-600',
    iconBg: 'bg-pink-500/10',
    iconColor: 'text-pink-400',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
};

function FeatureCard({ feature }: { feature: (typeof features)[0] }) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="group relative h-full"
    >
      {/* Glow effect on hover */}
      <div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-10`}
      />

      {/* Card */}
      <div className="border-landing-border from-card-gradient-from to-card-gradient-to hover:border-landing-border-muted relative h-full overflow-hidden rounded-2xl border bg-gradient-to-br p-6 transition-all duration-300 lg:p-8">
        {/* Subtle gradient overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-[0.03]`}
        />

        {/* Icon */}
        <motion.div
          whileHover={{
            rotate: [0, -10, 10, 0],
            transition: { duration: 0.5 },
          }}
          className={`relative h-12 w-12 rounded-xl ${feature.iconBg} mb-5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}
        >
          <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
        </motion.div>

        {/* Content */}
        <h3 className="text-landing-text relative mb-3 text-lg font-semibold">
          {feature.title}
        </h3>
        <p className="text-landing-text-muted relative text-sm leading-relaxed">
          {feature.description}
        </p>

        {/* Corner accent */}
        <div
          className={`absolute top-0 right-0 h-24 w-24 bg-gradient-to-br ${feature.gradient} rounded-bl-full opacity-0 transition-opacity duration-300 group-hover:opacity-5`}
        />
      </div>
    </motion.div>
  );
}

export function FeaturesGrid() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section
      ref={sectionRef}
      id="features"
      className="bg-landing-bg relative overflow-hidden py-24 lg:py-32"
    >
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/5 to-transparent" />

      {/* Decorative grid */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: '48px 48px',
        }}
      />

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
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2"
          >
            <Zap className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-medium tracking-wider text-indigo-500 uppercase">
              Powerful Features
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-landing-text mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl"
          >
            Everything You Need to{' '}
            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Land the Job
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-landing-text-muted mx-auto max-w-2xl text-lg"
          >
            Built specifically for developers who want to stand out and get more
            interviews.
          </motion.p>
        </motion.div>

        {/* Features grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
