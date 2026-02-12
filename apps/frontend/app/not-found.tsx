'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// Floating orb component (reused concept from landing)
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

export default function NotFound() {
  return (
    <main className="bg-landing-bg text-landing-text relative flex min-h-screen flex-col items-center justify-center overflow-hidden font-sans">
      {/* Background Orbs */}
      <FloatingOrb
        className="bg-orb-indigo -top-20 -left-20 h-[500px] w-[500px] opacity-20"
        delay={0}
      />
      <FloatingOrb
        className="bg-orb-purple right-0 bottom-0 h-[500px] w-[500px] opacity-20"
        delay={2}
      />

      {/* Grid Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(var(--landing-text) 1px, transparent 1px),
            linear-gradient(90deg, var(--landing-text) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />

      <div className="z-10 flex flex-col items-center px-4 text-center">
        {/* Animated 404 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <h1 className="text-[150px] leading-none font-black sm:text-[200px] md:text-[250px]">
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent opacity-90">
              4
            </span>
            <span className="relative inline-block">
              <span className="bg-gradient-to-b from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                0
              </span>
              {/* Zero glow effect */}
              <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-2xl" />
            </span>
            <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent opacity-90">
              4
            </span>
          </h1>
        </motion.div>

        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 space-y-6"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Page not found
          </h2>
          <p className="text-landing-text-muted mx-auto max-w-lg text-lg">
            Sorry, we couldn’t find the page you’re looking for. It might have
            been moved, deleted, or never existed.
          </p>

          <div className="pt-4">
            <Link
              href="/"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 hover:shadow-indigo-500/40 active:scale-95"
            >
              <ArrowLeft
                size={20}
                className="transition-transform group-hover:-translate-x-1"
              />
              Back to Home
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Decorative 'glass' card effect at bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="text-landing-text-muted absolute bottom-10 text-sm font-medium opacity-50"
      >
        Error 404
      </motion.div>
    </main>
  );
}
