'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  TextField,
  Label,
  Input,
  TextArea,
  Description,
  Button,
  Checkbox,
  Card,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { StepHeader } from '../step-header';
import type { Experience } from '../../../onboarding/types';

interface ExperienceStepProps {
  data: Experience[];
  onChange: (data: Experience[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const months = [
  { value: '01', label: 'Jan' },
  { value: '02', label: 'Feb' },
  { value: '03', label: 'Mar' },
  { value: '04', label: 'Apr' },
  { value: '05', label: 'May' },
  { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' },
  { value: '08', label: 'Aug' },
  { value: '09', label: 'Sep' },
  { value: '10', label: 'Oct' },
  { value: '11', label: 'Nov' },
  { value: '12', label: 'Dec' },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 30 }, (_, i) => String(currentYear - i));

export function ExperienceStep({
  data,
  onChange,
  onNext,
  onBack,
}: ExperienceStepProps) {
  const addExperience = () => {
    const newExp: Experience = {
      id: crypto.randomUUID(),
      jobTitle: '',
      company: '',
      startMonth: '',
      startYear: '',
      endMonth: '',
      endYear: '',
      isCurrent: false,
      description: '',
    };
    onChange([...data, newExp]);
  };

  const updateExperience = (
    id: string,
    field: keyof Experience,
    value: string | boolean,
  ) => {
    onChange(
      data.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp)),
    );
  };

  const removeExperience = (id: string) => {
    onChange(data.filter((exp) => exp.id !== id));
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <StepHeader
        icon="lucide:briefcase"
        title="Work Experience"
        description="Add your professional work history."
      />

      <AnimatePresence mode="popLayout">
        {data.map((exp, index) => (
          <motion.div
            key={exp.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            layout
          >
            <Card className="mb-4" variant="secondary">
              <Card.Header className="flex-row items-center justify-between">
                <Card.Title className="text-base">Job #{index + 1}</Card.Title>
                {data.length > 1 && (
                  <Button
                    isIconOnly
                    variant="ghost"
                    size="sm"
                    onPress={() => removeExperience(exp.id)}
                    className="text-danger"
                  >
                    <Icon icon="lucide:trash-2" className="size-4" />
                  </Button>
                )}
              </Card.Header>
              <Card.Content className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField className="w-full">
                    <Label>Job Title *</Label>
                    <Input
                      placeholder="Frontend Developer"
                      value={exp.jobTitle}
                      onChange={(e) =>
                        updateExperience(exp.id, 'jobTitle', e.target.value)
                      }
                    />
                  </TextField>

                  <TextField className="w-full">
                    <Label>Company *</Label>
                    <Input
                      placeholder="Acme Inc."
                      value={exp.company}
                      onChange={(e) =>
                        updateExperience(exp.id, 'company', e.target.value)
                      }
                    />
                  </TextField>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-foreground mb-2 block text-sm font-medium">
                      Start Date *
                    </Label>
                    <div className="flex gap-2">
                      <select
                        className="bg-surface-tertiary border-divider text-foreground flex-1 rounded-lg border px-3 py-2 text-sm"
                        value={exp.startMonth}
                        onChange={(e) =>
                          updateExperience(exp.id, 'startMonth', e.target.value)
                        }
                      >
                        <option value="">Month</option>
                        {months.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                      <select
                        className="bg-surface-tertiary border-divider text-foreground flex-1 rounded-lg border px-3 py-2 text-sm"
                        value={exp.startYear}
                        onChange={(e) =>
                          updateExperience(exp.id, 'startYear', e.target.value)
                        }
                      >
                        <option value="">Year</option>
                        {years.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-foreground mb-2 block text-sm font-medium">
                      End Date
                    </Label>
                    <div className="flex gap-2">
                      <select
                        className="bg-surface-tertiary border-divider text-foreground flex-1 rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
                        value={exp.endMonth}
                        onChange={(e) =>
                          updateExperience(exp.id, 'endMonth', e.target.value)
                        }
                        disabled={exp.isCurrent}
                      >
                        <option value="">Month</option>
                        {months.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                      <select
                        className="bg-surface-tertiary border-divider text-foreground flex-1 rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
                        value={exp.endYear}
                        onChange={(e) =>
                          updateExperience(exp.id, 'endYear', e.target.value)
                        }
                        disabled={exp.isCurrent}
                      >
                        <option value="">Year</option>
                        {years.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <Checkbox
                  isSelected={exp.isCurrent}
                  onChange={(isSelected) =>
                    updateExperience(exp.id, 'isCurrent', isSelected)
                  }
                >
                  <Checkbox.Control className="size-5">
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Content>
                    <span className="text-sm">I currently work here</span>
                  </Checkbox.Content>
                </Checkbox>

                <TextField className="w-full">
                  <Label>What did you do? *</Label>
                  <TextArea
                    placeholder="Led frontend development, built React dashboards, mentored junior devs..."
                    rows={3}
                    value={exp.description}
                    onChange={(e) =>
                      updateExperience(exp.id, 'description', e.target.value)
                    }
                  />
                  <Description>
                    Write 2-3 sentences. We&apos;ll expand this into
                    professional bullet points.
                  </Description>
                </TextField>
              </Card.Content>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      <motion.div
        className="flex flex-col gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Button variant="secondary" onPress={addExperience} className="w-full">
          <Icon icon="lucide:plus" className="mr-2 size-4" />
          Add {data.length > 0 ? 'Another ' : ''}Job
        </Button>

        {data.length === 0 && (
          <Button
            variant="ghost"
            onPress={onNext}
            className="text-muted-foreground w-full"
          >
            Skip - I don&apos;t have work experience yet
          </Button>
        )}
      </motion.div>

      <motion.div
        className="mt-8 flex items-center justify-between gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button variant="ghost" onPress={onBack} className="text-muted hover:text-foreground">
          <Icon icon="lucide:arrow-left" className="mr-2 size-4" />
          Back
        </Button>
        <Button onPress={onNext} className="group px-6">
          Next: Projects & Skills
          <Icon
            icon="lucide:arrow-right"
            className="ml-2 size-4 transition-transform group-hover:translate-x-1"
          />
        </Button>
      </motion.div>
    </div>
  );
}
