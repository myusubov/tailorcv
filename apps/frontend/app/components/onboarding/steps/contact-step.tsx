'use client';

import { motion } from 'framer-motion';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { StepHeader } from '../step-header';
import { ContactInputField } from './contact-input-field';

interface ContactStepProps {
  onNext: () => void;
  onBack: () => void;
}

const fieldVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.1 + i * 0.05, duration: 0.3 },
  }),
};

export function ContactStep({ onNext, onBack }: ContactStepProps) {
  return (
    <div className="mx-auto w-full max-w-xl">
      <StepHeader
        icon="lucide:user"
        title="Contact Information"
        description="Let's start with the basics."
      />

      <motion.div
        className="space-y-5"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <motion.div custom={0} variants={fieldVariants}>
            <ContactInputField
              name="contact.firstName"
              label="First Name"
              placeholder="e.g. Jane"
              isRequired
            />
          </motion.div>

          <motion.div custom={1} variants={fieldVariants}>
            <ContactInputField
              name="contact.lastName"
              label="Last Name"
              placeholder="e.g. Doe"
              isRequired
            />
          </motion.div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <motion.div custom={2} variants={fieldVariants}>
            <ContactInputField
              name="contact.email"
              label="Email Address"
              placeholder="e.g. jane.doe@example.com"
              type="email"
              isRequired
            />
          </motion.div>

          <motion.div custom={3} variants={fieldVariants}>
            <ContactInputField
              name="contact.phone"
              label="Phone Number"
              placeholder="e.g. +1 (555) 000-0000"
              useEmptyFallback
            />
          </motion.div>
        </div>

        <motion.div custom={4} variants={fieldVariants}>
          <ContactInputField
            name="contact.location"
            label="Location"
            placeholder="e.g. San Francisco, CA"
            useEmptyFallback
          />
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2">
          <motion.div custom={5} variants={fieldVariants}>
            <ContactInputField
              name="contact.githubUrl"
              label="GitHub URL"
              placeholder="https://github.com/username"
              useEmptyFallback
            />
          </motion.div>

          <motion.div custom={6} variants={fieldVariants}>
            <ContactInputField
              name="contact.linkedinUrl"
              label="LinkedIn URL"
              placeholder="https://linkedin.com/in/username"
              useEmptyFallback
            />
          </motion.div>
        </div>

        <motion.div custom={7} variants={fieldVariants}>
          <ContactInputField
            name="contact.websiteUrl"
            label="Portfolio / Website"
            placeholder="https://yourwebsite.com"
            useEmptyFallback
          />
        </motion.div>
      </motion.div>

      <motion.div
        className="mt-8 flex items-center justify-between gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          variant="ghost"
          onPress={onBack}
          className="text-muted hover:text-foreground"
        >
          <Icon icon="lucide:arrow-left" className="size-4" aria-hidden />
          Back
        </Button>
        <Button onPress={onNext} className="group px-6">
          Next: Professional Summary
          <Icon
            icon="lucide:arrow-right"
            className="size-4 transition-transform group-hover:translate-x-1"
            aria-hidden
          />
        </Button>
      </motion.div>
    </div>
  );
}
