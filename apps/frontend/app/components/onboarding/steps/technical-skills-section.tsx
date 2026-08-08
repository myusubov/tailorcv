'use client';

import type { KeyboardEvent } from 'react';
import {
  Button,
  Card,
  Chip,
  Description,
  Input,
  Label,
  TextField,
} from '@heroui/react';
import { Icon } from '@iconify/react';

import type { OnboardingFormInput } from '@/lib/schemas/onboarding';

interface TechnicalSkillsSectionProps {
  /** Clears all rendered skill chips. */
  clearSkills: () => void;
  /** Current skill input value. */
  skillInput: string;
  /** Current skill list. */
  skills: OnboardingFormInput['skills'];
  /** Handles Enter-to-add keyboard behavior. */
  onSkillKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  /** Removes one skill by ID. */
  removeSkill: ({ skillId }: { skillId: string }) => void;
  /** Updates the skill input value. */
  setSkillInput: (value: string) => void;
}

/**
 * Renders the technical skills input, clear-all action, and removable chips
 * for the Projects & Skills onboarding step.
 */
export function TechnicalSkillsSection({
  clearSkills,
  skillInput,
  skills,
  onSkillKeyDown,
  removeSkill,
  setSkillInput,
}: TechnicalSkillsSectionProps) {
  return (
    <Card>
      <Card.Content className="space-y-4">
        <TextField className="w-full">
          <div className="flex items-center justify-between gap-3">
            <Label>Add Skills</Label>
            {skills.length > 1 && (
              <Button
                variant="ghost"
                aria-label="Clear all skills"
                onPress={clearSkills}
                className="text-muted hover:text-foreground px-2 text-sm"
              >
                <Icon icon="lucide:x-circle" className="size-4" />
                Clear all
              </Button>
            )}
          </div>
          <Input
            placeholder="Type a skill and press Enter..."
            value={skillInput}
            onChange={(event) => setSkillInput(event.target.value)}
            onKeyDown={onSkillKeyDown}
          />
          <Description className="sr-only">
            Press Enter to add each skill
          </Description>
        </TextField>
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Chip
                key={skill.id}
                className="bg-accent/10 text-accent gap-1 pr-1"
              >
                {skill.name}
                <button
                  type="button"
                  aria-label={`Remove ${skill.name} skill`}
                  onClick={() => removeSkill({ skillId: skill.id })}
                  className="hover:bg-accent/20 rounded-full p-0.5"
                >
                  <Icon icon="lucide:x" className="size-3" />
                </button>
              </Chip>
            ))}
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
