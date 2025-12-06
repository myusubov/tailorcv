'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Github,
  FolderGit2,
  Code2,
  Sparkles,
  Star,
  GitBranch,
  Terminal,
} from 'lucide-react';

const benefits = [
  {
    icon: FolderGit2,
    title: 'Auto-import 10+ projects',
    description: 'Your best work, automatically added to your resume',
  },
  {
    icon: Code2,
    title: 'Detect 20+ technologies',
    description: 'Languages, frameworks, and tools you actually use',
  },
  {
    icon: Sparkles,
    title: 'Generate descriptions with AI',
    description: 'Professional project summaries written for you',
  },
];

const codeLines = [
  { text: '// Importing your GitHub profile...', delay: 0 },
  { text: 'const repos = await github.getRepos("yourname");', delay: 0.5 },
  { text: '', delay: 0.8 },
  { text: '// Analyzing technologies...', delay: 1.0 },
  { text: 'const skills = detectTechnologies(repos);', delay: 1.3 },
  { text: '// Found: React, TypeScript, Node.js, PostgreSQL', delay: 1.6 },
  { text: '', delay: 1.9 },
  { text: '// Generating resume content...', delay: 2.1 },
  { text: 'const resume = await ai.generateResume({', delay: 2.4 },
  { text: '  projects: repos.slice(0, 10),', delay: 2.6 },
  { text: '  skills: skills,', delay: 2.8 },
  { text: '  jobDescription: targetJob', delay: 3.0 },
  { text: '});', delay: 3.2 },
  { text: '', delay: 3.4 },
  { text: '// ✓ Resume tailored and ready!', delay: 3.6 },
];

function TypingCodeBlock() {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!isInView) return;

    const timers: NodeJS.Timeout[] = [];

    codeLines.forEach((line, index) => {
      const timer = setTimeout(() => {
        setVisibleLines(index + 1);
      }, line.delay * 1000);
      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
  }, [isInView]);

  return (
    <div ref={ref} className="relative">
      {/* Terminal header */}
      <div className="border-landing-border bg-surface flex items-center gap-2 rounded-t-xl border-b px-4 py-3">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500/80" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <div className="h-3 w-3 rounded-full bg-green-500/80" />
        </div>
        <div className="flex-1 text-center">
          <span className="text-landing-text-muted flex items-center justify-center gap-2 font-mono text-xs">
            <Terminal className="h-3 w-3" />
            tailorcv-import.ts
          </span>
        </div>
      </div>

      {/* Code content */}
      <div className="bg-code-bg min-h-[320px] overflow-hidden rounded-b-xl p-4 font-mono text-sm">
        {codeLines.slice(0, visibleLines).map((line, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`leading-relaxed ${
              line.text.startsWith('//')
                ? 'text-landing-text-muted'
                : line.text.includes('✓')
                  ? 'text-emerald-500'
                  : line.text.includes('Found:')
                    ? 'text-amber-400'
                    : 'text-landing-text-secondary'
            }`}
          >
            {line.text || '\u00A0'}
            {index === visibleLines - 1 && visibleLines < codeLines.length && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ type: 'tween', duration: 0.5, repeat: 9999 }}
                className="ml-1 inline-block h-4 w-2 bg-indigo-400 align-middle"
              />
            )}
          </motion.div>
        ))}
        {visibleLines === 0 && isInView && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ type: 'tween', duration: 0.5, repeat: 9999 }}
            className="inline-block h-4 w-2 bg-indigo-400"
          />
        )}
      </div>
    </div>
  );
}

function BenefitCard({
  benefit,
  index,
}: {
  benefit: (typeof benefits)[0];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 * index }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group border-landing-border bg-surface/50 hover:border-landing-border-muted relative rounded-xl border p-5 backdrop-blur-sm transition-all"
    >
      {/* Icon */}
      <div className="group-hover:bg-orb-indigo mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 transition-colors">
        <benefit.icon className="h-5 w-5 text-indigo-500" />
      </div>

      {/* Content */}
      <h4 className="text-landing-text mb-2 font-semibold">{benefit.title}</h4>
      <p className="text-landing-text-muted text-sm">{benefit.description}</p>
    </motion.div>
  );
}

export function GithubFeature() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section
      ref={sectionRef}
      className="bg-landing-bg relative overflow-hidden py-24 lg:py-32"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/5 to-transparent" />

      {/* Decorative orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ type: 'tween', duration: 8, repeat: 9999 }}
        className="bg-orb-violet absolute top-1/3 -left-32 h-64 w-64 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ type: 'tween', duration: 10, repeat: 9999, delay: 2 }}
        className="bg-orb-indigo absolute -right-32 bottom-1/4 h-80 w-80 rounded-full blur-3xl"
      />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main glassmorphism container */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8 }}
          className="relative overflow-hidden rounded-3xl"
        >
          {/* Glass background */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-indigo-500/5 to-purple-500/10 backdrop-blur-xl" />
          <div className="bg-surface/60 absolute inset-0" />

          {/* Border glow */}
          <div className="border-landing-border absolute inset-0 rounded-3xl border" />

          {/* Inner content */}
          <div className="relative z-10 p-8 lg:p-12">
            {/* Header */}
            <div className="mb-12 text-center">
              {/* Unique badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={
                  isInView
                    ? { opacity: 1, scale: 1 }
                    : { opacity: 0, scale: 0.9 }
                }
                transition={{ duration: 0.5 }}
                className="bg-orb-violet mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 px-4 py-2"
              >
                <Star className="h-4 w-4 text-violet-500" />
                <span className="text-sm font-medium text-violet-500">
                  No competitor has this
                </span>
              </motion.div>

              {/* Main icon */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={
                  isInView
                    ? { opacity: 1, scale: 1 }
                    : { opacity: 0, scale: 0.5 }
                }
                transition={{ duration: 0.6, delay: 0.1, type: 'spring' }}
                className="border-landing-border-muted from-card-gradient-dark-from to-card-gradient-dark-to mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border bg-gradient-to-br shadow-2xl"
              >
                <Github className="text-landing-text h-10 w-10" />
              </motion.div>

              {/* Headline */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={
                  isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                }
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-landing-text mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl"
              >
                Your GitHub ={' '}
                <span className="bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">
                  Your Resume
                </span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={
                  isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                }
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-landing-text-muted mx-auto max-w-2xl text-lg"
              >
                We automatically import your projects, skills, and tech stack.
                No manual entry required.
              </motion.p>
            </div>

            {/* Two column layout */}
            <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
              {/* Left: Benefits */}
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <BenefitCard
                    key={benefit.title}
                    benefit={benefit}
                    index={index}
                  />
                ))}

                {/* GitHub stats mockup */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="border-landing-border bg-surface/50 mt-6 rounded-xl border p-4"
                >
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-landing-text-muted flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-emerald-500" />
                      <span>47 repos imported</span>
                    </div>
                    <div className="text-landing-text-muted flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-blue-400" />
                      <span>23 skills detected</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Right: Code snippet */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={
                  isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }
                }
                transition={{ duration: 0.8, delay: 0.3 }}
                className="relative"
              >
                {/* Glow behind code block */}
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 blur-2xl" />

                {/* Code block with border */}
                <div className="border-landing-border relative overflow-hidden rounded-xl border shadow-2xl shadow-indigo-500/10">
                  <TypingCodeBlock />
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
