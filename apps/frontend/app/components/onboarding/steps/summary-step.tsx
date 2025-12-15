'use client';

import { motion } from 'framer-motion';
import { TextField, Label, TextArea, Description, Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { StepHeader } from '../step-header';

interface SummaryStepProps {
  data: string;
  onChange: (data: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function SummaryStep({ data, onChange, onNext, onBack }: SummaryStepProps) {
  return (
    <div className="mx-auto w-full max-w-xl">
      <StepHeader
        icon="lucide:file-text"
        title="Professional Summary"
        description="Tell us about yourself in 2-3 sentences. What do you do? What are your key skills?"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <TextField className="w-full">
          <Label>Your Summary</Label>
          <TextArea
            placeholder="I'm a full-stack developer with 3 years of experience building scalable web applications. I specialize in React, TypeScript, and Node.js, with a passion for creating user-friendly interfaces..."
            rows={6}
            value={data}
            onChange={(e) => onChange(e.target.value)}
          />
          <Description>
            Mention your role, experience level, and main technologies. We&apos;ll refine this
            later.
          </Description>
        </TextField>
      </motion.div>

      <motion.div
        className="bg-surface-secondary mt-6 rounded-xl p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
            <Icon icon="lucide:lightbulb" className="size-4" />
          </div>
          <div>
            <p className="text-foreground text-sm font-medium">Need help?</p>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Not sure what to write? You can skip this and we&apos;ll generate one based on your
              experience and projects.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="bg-surface-secondary mt-4 flex items-center justify-center rounded-xl p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button variant="ghost" className="text-primary">
          <Icon icon="lucide:sparkles" className="mr-2 size-4" />
          Generate with AI
        </Button>
      </motion.div>

      <motion.div
        className="mt-8 flex justify-between"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Button variant="ghost" onPress={onBack}>
          <Icon icon="lucide:arrow-left" className="mr-2 size-4" />
          Back
        </Button>
        <Button onPress={onNext} className="group px-6">
          Next: Experience
          <Icon
            icon="lucide:arrow-right"
            className="ml-2 size-4 transition-transform group-hover:translate-x-1"
          />
        </Button>
      </motion.div>
    </div>
  );
}
