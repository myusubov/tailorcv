'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Star, Quote, Users } from 'lucide-react';

const testimonials = [
  {
    quote:
      'Got 3x more interviews after using TailorCV. The GitHub integration is genius!',
    name: 'Alex Chen',
    role: 'Frontend Developer',
    location: 'San Francisco, USA',
    avatar: 'A',
    avatarBg: 'from-violet-500 to-purple-600',
    rating: 5,
  },
  {
    quote:
      'Saved me 20+ hours during my job search. Worth every penny. The AI actually understands tech roles.',
    name: 'Priya Sharma',
    role: 'Full-Stack Developer',
    location: 'Bangalore, India',
    avatar: 'P',
    avatarBg: 'from-emerald-500 to-cyan-600',
    rating: 5,
  },
  {
    quote:
      'Finally a resume tool that understands developers. No more explaining what React is to generic AI.',
    name: 'Marco Silva',
    role: 'Backend Developer',
    location: 'São Paulo, Brazil',
    avatar: 'M',
    avatarBg: 'from-amber-500 to-orange-600',
    rating: 5,
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
  hidden: (index: number) => ({
    opacity: 0,
    x: index % 2 === 0 ? -40 : 40,
  }),
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: 'easeOut' as const },
  },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 + i * 0.1, type: 'spring', stiffness: 300 }}
        >
          <Star
            className={`h-4 w-4 ${
              i < rating
                ? 'fill-amber-400 text-amber-400'
                : 'text-landing-text-muted fill-zinc-600'
            }`}
          />
        </motion.div>
      ))}
    </div>
  );
}

function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: (typeof testimonials)[0];
  index: number;
}) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="group relative h-full"
    >
      {/* Glow effect */}
      <div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${testimonial.avatarBg} opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-10`}
      />

      {/* Card */}
      <div className="border-landing-border from-card-gradient-from to-card-gradient-to hover:border-landing-border-muted relative h-full rounded-2xl border bg-gradient-to-br p-6 transition-all duration-300 lg:p-8">
        {/* Quote icon */}
        <div className="absolute top-6 right-6 opacity-10 transition-opacity group-hover:opacity-20">
          <Quote className="text-landing-text h-12 w-12" />
        </div>

        {/* Rating */}
        <div className="mb-4">
          <StarRating rating={testimonial.rating} />
        </div>

        {/* Quote */}
        <blockquote className="text-landing-text-secondary relative z-10 mb-6 text-lg leading-relaxed">
          &ldquo;{testimonial.quote}&rdquo;
        </blockquote>

        {/* Author */}
        <div className="mt-auto flex items-center gap-4">
          {/* Avatar */}
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className={`h-12 w-12 rounded-full bg-gradient-to-br ${testimonial.avatarBg} text-landing-text flex items-center justify-center text-lg font-semibold shadow-lg`}
          >
            {testimonial.avatar}
          </motion.div>

          {/* Info */}
          <div>
            <div className="text-landing-text font-semibold">
              {testimonial.name}
            </div>
            <div className="text-landing-text-muted text-sm">
              {testimonial.role} • {testimonial.location}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function Testimonials() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section
      ref={sectionRef}
      className="bg-landing-bg relative overflow-hidden py-24 lg:py-32"
    >
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/5 to-transparent" />

      {/* Decorative orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ type: 'tween', duration: 10, repeat: 9999 }}
        className="bg-orb-purple absolute top-1/4 -left-32 h-64 w-64 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{ type: 'tween', duration: 8, repeat: 9999, delay: 2 }}
        className="bg-orb-indigo absolute -right-32 bottom-1/4 h-80 w-80 rounded-full blur-3xl"
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
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2"
          >
            <Users className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium tracking-wider text-purple-500 uppercase">
              Social Proof
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-landing-text mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl"
          >
            Loved by{' '}
            <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Developers Worldwide
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-landing-text-muted mx-auto max-w-2xl text-lg"
          >
            Join 200+ developers who&apos;ve transformed their job search with
            TailorCV.
          </motion.p>
        </motion.div>

        {/* Testimonials grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8"
        >
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.name}
              testimonial={testimonial}
              index={index}
            />
          ))}
        </motion.div>

        {/* Bottom stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 flex flex-wrap justify-center gap-8 lg:gap-16"
        >
          {[
            { value: '200+', label: 'Happy Developers' },
            { value: '1,500+', label: 'Resumes Created' },
            { value: '4.9/5', label: 'Average Rating' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-landing-text mb-1 text-3xl font-bold lg:text-4xl">
                {stat.value}
              </div>
              <div className="text-landing-text-muted text-sm">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
