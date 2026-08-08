'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Check, Sparkles, Crown, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Route } from 'next';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Perfect for trying out TailorCV',
    features: [
      '3 resumes per month',
      'Basic AI customization',
      'Standard templates',
      'PDF export',
      'Email support',
    ],
    cta: 'Start Free',
    ctaLink: '/register',
    popular: false,
    badge: null,
    gradient: 'from-zinc-500 to-zinc-600',
    borderColor: 'border-landing-border',
    hoverBorder: 'hover:border-landing-border-muted',
  },
  {
    name: 'Pro Monthly',
    price: '$12',
    period: '/month',
    description: 'For active job seekers',
    features: [
      'Unlimited resumes',
      'Advanced AI customization',
      'Premium templates',
      'GitHub integration',
      'Application tracker',
      'Version history',
      'Priority support',
    ],
    cta: 'Start Pro Trial',
    ctaLink: '/register?plan=pro',
    popular: true,
    badge: 'Most Popular',
    gradient: 'from-indigo-500 to-purple-600',
    borderColor: 'border-indigo-500/50',
    hoverBorder: 'hover:border-indigo-400',
  },
  {
    name: 'Pro Lifetime',
    price: '$39',
    period: 'one-time',
    description: 'Pay once, use forever',
    features: [
      'Everything in Pro',
      'Lifetime access',
      'All future updates',
      'Premium templates forever',
      'Priority support forever',
      'Early access to features',
    ],
    cta: 'Get Lifetime Access',
    ctaLink: '/register?plan=lifetime',
    popular: false,
    badge: 'Best Value',
    gradient: 'from-amber-500 to-orange-600',
    borderColor: 'border-amber-500/30',
    hoverBorder: 'hover:border-amber-400/50',
  },
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

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' as const },
  },
};

function PricingCard({
  plan,
  index,
}: {
  plan: (typeof plans)[0];
  index: number;
}) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{
        y: -8,
        transition: { duration: 0.3 },
      }}
      className={`group relative h-full ${plan.popular ? 'lg:-mt-4 lg:mb-4' : ''}`}
    >
      {/* Glow effect for popular plan */}
      {plan.popular && (
        <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 opacity-30 blur transition-opacity duration-500 group-hover:opacity-50" />
      )}

      {/* Card */}
      <div
        className={`from-card-gradient-from to-card-gradient-to relative h-full rounded-2xl border bg-gradient-to-br ${plan.borderColor} ${plan.hoverBorder} flex flex-col p-6 transition-all duration-300 lg:p-8`}
      >
        {/* Badge */}
        {plan.badge && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + index * 0.1, type: 'spring' }}
            className={`absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-gradient-to-r ${plan.gradient} text-landing-text px-4 py-1.5 text-xs font-semibold shadow-lg`}
          >
            {plan.popular ? (
              <Sparkles className="h-3.5 w-3.5" />
            ) : (
              <Crown className="h-3.5 w-3.5" />
            )}
            {plan.badge}
          </motion.div>
        )}

        {/* Plan name */}
        <div className="mb-4">
          <h3 className="text-landing-text text-lg font-semibold">
            {plan.name}
          </h3>
          <p className="text-landing-text-muted mt-1 text-sm">
            {plan.description}
          </p>
        </div>

        {/* Price */}
        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="text-landing-text text-4xl font-bold lg:text-5xl">
              {plan.price}
            </span>
            <span className="text-landing-text-muted text-sm">
              {plan.period}
            </span>
          </div>
        </div>

        {/* Features */}
        <ul className="mb-8 flex-1 space-y-3">
          {plan.features.map((feature, featureIndex) => (
            <motion.li
              key={feature}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + featureIndex * 0.05 }}
              className="flex items-start gap-3"
            >
              <div
                className={`h-5 w-5 rounded-full bg-gradient-to-br ${plan.gradient} mt-0.5 flex flex-shrink-0 items-center justify-center`}
              >
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className="text-landing-text-secondary text-sm">
                {feature}
              </span>
            </motion.li>
          ))}
        </ul>

        {/* CTA Button */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link
            href={plan.ctaLink as Route}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all duration-300 ${
              plan.popular
                ? `bg-gradient-to-r ${plan.gradient} text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40`
                : 'bg-surface-secondary text-landing-text-secondary hover:bg-surface-tertiary hover:text-landing-text'
            }`}
          >
            {plan.cta}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}

export function Pricing() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section
      ref={sectionRef}
      id="pricing"
      className="bg-landing-bg relative overflow-hidden py-24 lg:py-32"
    >
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/5 to-transparent" />

      {/* Decorative orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ type: 'tween', duration: 10, repeat: 9999 }}
        className="bg-orb-indigo absolute top-1/3 -left-32 h-64 w-64 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{ type: 'tween', duration: 8, repeat: 9999, delay: 2 }}
        className="bg-orb-purple absolute -right-32 bottom-1/4 h-80 w-80 rounded-full blur-3xl"
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
              Pricing
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-landing-text mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl"
          >
            Simple,{' '}
            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Honest Pricing
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-landing-text-muted mx-auto max-w-2xl text-lg"
          >
            Start free, upgrade when you need more. No hidden fees, cancel
            anytime.
          </motion.p>
        </motion.div>

        {/* Pricing cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid items-start gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8"
        >
          {plans.map((plan, index) => (
            <PricingCard key={plan.name} plan={plan} index={index} />
          ))}
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-landing-text-muted mt-12 flex flex-wrap justify-center gap-6 text-sm lg:gap-10"
        >
          {[
            '✓ Free tier forever',
            '✓ Cancel anytime',
            '✓ Secure payment',
            '✓ 7-day money back',
          ].map((badge) => (
            <div key={badge} className="flex items-center gap-2">
              {badge}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
