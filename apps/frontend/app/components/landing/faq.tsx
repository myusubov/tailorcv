'use client';

import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, Plus, Minus } from 'lucide-react';

const faqs = [
  {
    question: 'How does GitHub integration work?',
    answer:
      'Simply connect your GitHub account with one click. We automatically scan your repositories to identify your projects, programming languages, frameworks, and technologies. This information is then used to populate your resume with accurate, up-to-date skills and project descriptions.',
  },
  {
    question: 'Is my data private and secure?',
    answer:
      'Absolutely. We take security seriously. Your data is encrypted in transit and at rest. We only access the public information from your GitHub profile (or private repos if you grant permission). We never share your data with third parties, and you can delete your account and all associated data at any time.',
  },
  {
    question: 'Can I edit the AI-generated resume?',
    answer:
      'Yes! The AI provides a great starting point, but you have full control. You can edit any section, rewrite descriptions, add or remove projects, and customize everything to your liking. Think of the AI as your writing assistant, not a replacement.',
  },
  {
    question: 'What makes TailorCV better than ChatGPT?',
    answer:
      'TailorCV is purpose-built for developers. Unlike ChatGPT, we integrate directly with GitHub to import your real projects and skills. We understand tech stacks, frameworks, and developer terminology. Plus, we handle formatting and ATS optimization automatically—no copy-pasting or fixing layouts required.',
  },
  {
    question: 'Do you offer refunds?',
    answer:
      "Yes, we offer a 7-day money-back guarantee for all paid plans. If you're not satisfied with TailorCV for any reason, contact our support team within 7 days of purchase and we'll process a full refund. No questions asked.",
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      "Absolutely. There are no long-term contracts or commitments. You can cancel your Pro Monthly subscription at any time from your account settings. You'll continue to have access until the end of your billing period. Lifetime plans are one-time purchases and never expire.",
  },
  {
    question: 'What ATS systems are you compatible with?',
    answer:
      'Our PDF output is designed to be compatible with all major Applicant Tracking Systems including Greenhouse, Lever, Workday, Taleo, iCIMS, and many more. We use clean formatting, standard fonts, and proper document structure to ensure your resume passes automated screening.',
  },
  {
    question: 'How many job applications can I track?',
    answer:
      'Free users can track up to 10 applications. Pro users (both Monthly and Lifetime) get unlimited application tracking with features like status updates, interview scheduling, follow-up reminders, and notes for each application.',
  },
];

function FAQItem({
  faq,
  index,
  isOpen,
  onToggle,
}: {
  faq: (typeof faqs)[0];
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group"
    >
      <div
        className={`overflow-hidden rounded-xl border transition-all duration-300 ${
          isOpen
            ? 'bg-surface/80 border-indigo-500/30'
            : 'bg-surface/30 border-landing-border hover:border-landing-border-muted'
        }`}
      >
        {/* Question button */}
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-between p-5 text-left lg:p-6"
          aria-expanded={isOpen}
        >
          <span
            className={`text-base font-medium transition-colors lg:text-lg ${
              isOpen
                ? 'text-landing-text'
                : 'text-landing-text-secondary group-hover:text-landing-text'
            }`}
          >
            {faq.question}
          </span>

          {/* Toggle icon */}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' as const }}
            className={`ml-4 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
              isOpen
                ? 'bg-orb-indigo text-indigo-500'
                : 'bg-surface-secondary text-landing-text-muted group-hover:bg-surface-tertiary'
            }`}
          >
            {isOpen ? (
              <Minus className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </motion.div>
        </button>

        {/* Answer */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' as const }}
            >
              <div className="px-5 pb-5 lg:px-6 lg:pb-6">
                <div className="bg-surface-secondary mb-4 h-px" />
                <p className="text-landing-text-muted leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function FAQ() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      ref={sectionRef}
      id="faq"
      className="bg-landing-bg relative overflow-hidden py-24 lg:py-32"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/50 to-transparent" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center lg:mb-16"
        >
          {/* Label */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={
              isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }
            }
            transition={{ duration: 0.5 }}
            className="bg-surface-secondary/50 border-landing-border-muted mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2"
          >
            <HelpCircle className="text-landing-text-muted h-4 w-4" />
            <span className="text-landing-text-muted text-sm font-medium tracking-wider uppercase">
              FAQ
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-landing-text mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl"
          >
            Frequently Asked{' '}
            <span className="bg-gradient-to-r from-zinc-400 to-zinc-200 bg-clip-text text-transparent">
              Questions
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-landing-text-muted mx-auto max-w-2xl text-lg"
          >
            Got questions? We&apos;ve got answers. If you can&apos;t find what
            you&apos;re looking for, reach out to our support team.
          </motion.p>
        </motion.div>

        {/* FAQ list */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              faq={faq}
              index={index}
              isOpen={openIndex === index}
              onToggle={() => handleToggle(index)}
            />
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 text-center"
        >
          <p className="text-landing-text-muted">
            Still have questions?{' '}
            <a
              href="mailto:support@tailorcv.app"
              className="font-medium text-indigo-500 transition-colors hover:text-indigo-500"
            >
              Contact our support team
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
