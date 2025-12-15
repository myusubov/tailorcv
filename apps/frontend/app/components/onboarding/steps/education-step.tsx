'use client';

import { motion } from 'framer-motion';
import { TextField, Label, Input, Button, Checkbox, Card } from '@heroui/react';
import { Icon } from '@iconify/react';
import { StepHeader } from '../step-header';
import type { Education } from '../../../onboarding/types';

interface EducationStepProps {
  data: Education;
  onChange: (data: Education) => void;
  onFinish: () => void;
  onBack: () => void;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 40 }, (_, i) => String(currentYear - i));

export function EducationStep({ data, onChange, onFinish, onBack }: EducationStepProps) {
  const updateField = (field: keyof Education, value: string | boolean) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="mx-auto w-full max-w-xl">
      <StepHeader
        icon="lucide:graduation-cap"
        title="Education"
        description="Almost done! Tell us about your education."
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card variant="secondary">
          <Card.Content className="space-y-5 pt-4">
            <TextField className="w-full">
              <Label>Degree / Certification</Label>
              <Input
                placeholder="Bachelor's in Computer Science"
                value={data.degree}
                onChange={(e) => updateField('degree', e.target.value)}
                disabled={data.isSelfTaught}
              />
            </TextField>

            <TextField className="w-full">
              <Label>School / Institution</Label>
              <Input
                placeholder="University of Technology"
                value={data.school}
                onChange={(e) => updateField('school', e.target.value)}
                disabled={data.isSelfTaught}
              />
            </TextField>

            <div>
              <Label className="text-foreground mb-2 block text-sm font-medium">
                Graduation Year
              </Label>
              <select
                className="bg-surface-tertiary border-divider text-foreground w-full rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
                value={data.graduationYear}
                onChange={(e) => updateField('graduationYear', e.target.value)}
                disabled={data.isSelfTaught}
              >
                <option value="">Select year</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-divider relative border-t pt-4">
              <span className="bg-surface-secondary text-muted-foreground absolute -top-3 left-1/2 -translate-x-1/2 px-3 text-sm">
                Or
              </span>
            </div>

            <Checkbox
              isSelected={data.isSelfTaught}
              onChange={(isSelected) => updateField('isSelfTaught', isSelected)}
            >
              <Checkbox.Control className="size-5">
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Content>
                <span className="text-sm">I&apos;m self-taught / bootcamp graduate</span>
              </Checkbox.Content>
            </Checkbox>
          </Card.Content>
        </Card>
      </motion.div>

      <motion.div
        className="bg-surface-secondary mt-6 rounded-xl p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
            <Icon icon="lucide:check-circle" className="size-4" />
          </div>
          <div>
            <p className="text-foreground text-sm font-medium">You&apos;re all set!</p>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Click the button below to generate your professional resume.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="mt-8 flex justify-between"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button variant="ghost" onPress={onBack}>
          <Icon icon="lucide:arrow-left" className="mr-2 size-4" />
          Back
        </Button>
        <Button onPress={onFinish} className="group bg-green-600 px-6 hover:bg-green-700">
          <Icon icon="lucide:sparkles" className="mr-2 size-4" />
          Generate Resume!
        </Button>
      </motion.div>
    </div>
  );
}
