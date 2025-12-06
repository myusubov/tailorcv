'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  Shield,
  CreditCard,
  Infinity,
  Sparkles,
} from 'lucide-react';

const trustBadges = [
  { icon: Infinity, text: 'Free tier forever' },
  { icon: CreditCard, text: 'No credit card required' },
  { icon: Shield, text: 'Secure with Clerk' },
];

export function FinalCTA() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-24 lg:py-32"
    >
      {/* Dark gradient background */}
      <div className="from-landing-bg to-landing-bg absolute inset-0 bg-gradient-to-br via-indigo-950/20" />

      {/* Animated gradient orbs */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ type: 'tween', duration: 8, repeat: 9999 }}
        className="bg-orb-indigo absolute top-1/2 left-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ type: 'tween', duration: 10, repeat: 9999, delay: 2 }}
        className="bg-orb-purple absolute top-1/2 right-1/4 h-[400px] w-[400px] translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        {/* Sparkle icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={
            isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }
          }
          transition={{ duration: 0.6, type: 'spring' }}
          className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/20 to-purple-500/20"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              type: 'tween',
              duration: 20,
              repeat: 9999,
              ease: 'linear',
            }}
          >
            <Sparkles className="h-8 w-8 text-indigo-500" />
          </motion.div>
        </motion.div>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-landing-text mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl xl:text-6xl"
        >
          Ready to Land Your{' '}
          <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Dream Job?
          </span>
        </motion.h2>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-landing-text-muted mx-auto mb-10 max-w-2xl text-lg sm:text-xl"
        >
          Join 200+ developers who customize resumes in seconds, not hours.
          Start free and land more interviews.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-12"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block"
          >
            <Link
              href="/register"
              className="group inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-10 py-5 text-lg font-semibold text-white shadow-2xl shadow-indigo-500/30 transition-all duration-300 hover:shadow-indigo-500/50"
            >
              <span>Start Free - No Credit Card Required</span>
              <ArrowRight
                size={20}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </motion.div>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-6 lg:gap-10"
        >
          {trustBadges.map((badge, index) => (
            <motion.div
              key={badge.text}
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
              className="text-landing-text-muted flex items-center gap-2"
            >
              <badge.icon className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium">{badge.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Decorative bottom glow */}
        <div className="absolute bottom-0 left-1/2 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
      </div>
    </section>
  );
}
