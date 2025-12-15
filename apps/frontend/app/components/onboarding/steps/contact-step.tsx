'use client';

import { motion } from 'framer-motion';
import { TextField, Label, Input, Description, Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { StepHeader } from '../step-header';
import type { ContactInfo } from '../../../onboarding/types';

interface ContactStepProps {
  data: ContactInfo;
  onChange: (data: ContactInfo) => void;
  onNext: () => void;
}

const fieldVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.1 + i * 0.05, duration: 0.3 },
  }),
};

export function ContactStep({ data, onChange, onNext }: ContactStepProps) {
  const updateField = (field: keyof ContactInfo, value: string) => {
    onChange({ ...data, [field]: value });
  };

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
            <TextField className="w-full">
              <Label>Full Name *</Label>
              <Input
                placeholder="John Doe"
                value={data.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
              />
            </TextField>
          </motion.div>

          <motion.div custom={1} variants={fieldVariants}>
            <TextField className="w-full" type="email">
              <Label>Email Address *</Label>
              <Input
                placeholder="john@example.com"
                value={data.email}
                onChange={(e) => updateField('email', e.target.value)}
              />
            </TextField>
          </motion.div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <motion.div custom={2} variants={fieldVariants}>
            <TextField className="w-full">
              <Label>Phone Number</Label>
              <Input
                placeholder="+1 (555) 123-4567"
                value={data.phone}
                onChange={(e) => updateField('phone', e.target.value)}
              />
              <Description>Optional</Description>
            </TextField>
          </motion.div>

          <motion.div custom={3} variants={fieldVariants}>
            <TextField className="w-full">
              <Label>Location *</Label>
              <Input
                placeholder="San Francisco, CA"
                value={data.location}
                onChange={(e) => updateField('location', e.target.value)}
              />
            </TextField>
          </motion.div>
        </div>

        <motion.div custom={4} variants={fieldVariants}>
          <TextField className="w-full">
            <Label>GitHub</Label>
            <Input
              placeholder="github.com/username"
              value={data.github}
              onChange={(e) => updateField('github', e.target.value)}
            />
          </TextField>
        </motion.div>

        <motion.div custom={5} variants={fieldVariants}>
          <TextField className="w-full">
            <Label>LinkedIn</Label>
            <Input
              placeholder="linkedin.com/in/username"
              value={data.linkedin}
              onChange={(e) => updateField('linkedin', e.target.value)}
            />
            <Description>Optional</Description>
          </TextField>
        </motion.div>

        <motion.div custom={6} variants={fieldVariants}>
          <TextField className="w-full">
            <Label>Portfolio Website</Label>
            <Input
              placeholder="yourwebsite.com"
              value={data.portfolio}
              onChange={(e) => updateField('portfolio', e.target.value)}
            />
            <Description>Optional</Description>
          </TextField>
        </motion.div>
      </motion.div>

      <motion.div
        className="mt-8 flex justify-end"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Button onPress={onNext} className="group px-6">
          Next: Professional Summary
          <Icon
            icon="lucide:arrow-right"
            className="ml-2 size-4 transition-transform group-hover:translate-x-1"
          />
        </Button>
      </motion.div>
    </div>
  );
}
