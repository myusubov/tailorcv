'use client';

import {
  TextField,
  Label,
  Input,
  TextArea,
  Description,
  Button,
  Checkbox,
  Card,
  FieldError,
  DateField,
  DateInputGroup,
  Tooltip,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { parseDate } from '@internationalized/date';

import type { OnboardingFormInput } from '@/lib/schemas/onboarding';

export interface ProjectItemContentProps {
  /** Array index of this project item */
  index: number;
  /** Callback to delete this item */
  /** Callback to delete this item */
  onDelete: () => void;
  /** Callback to duplicate this item */
  onDuplicate: () => void;
}

/**
 * Renders the content of a single project entry card.
 * Handles form fields for name, tech stack, description, URLs, dates, and current status.
 */
export function ProjectItemContent({
  index,
  onDelete,
  onDuplicate,
}: ProjectItemContentProps) {
  const { control, setValue } = useFormContext<OnboardingFormInput>();
  const isCurrent = useWatch({ control, name: `projects.${index}.isCurrent` });
  const tech = useWatch({ control, name: `projects.${index}.tech` });

  return (
    <Card className="mb-4">
      <Card.Header className="flex-row items-center justify-between">
        <Card.Title className="text-base">Project #{index + 1}</Card.Title>
        <div className="flex items-center gap-1">
          <Tooltip delay={500}>
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              onPress={onDuplicate}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon icon="lucide:copy" />
            </Button>
            <Tooltip.Content>
              <p>Duplicate</p>
            </Tooltip.Content>
          </Tooltip>
          <Tooltip delay={500}>
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              onPress={onDelete}
              className="text-danger/50 hover:bg-danger/10 hover:text-danger transition-colors"
            >
              <Icon icon="lucide:trash-2" />
            </Button>
            <Tooltip.Content>
              <p>Remove project</p>
            </Tooltip.Content>
          </Tooltip>
        </div>
      </Card.Header>
      <Card.Content className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name={`projects.${index}.name`}
            control={control}
            render={({ field, fieldState }) => (
              <TextField className="w-full" isInvalid={!!fieldState.error}>
                <Label>Project Name *</Label>
                <Input {...field} placeholder="TailorCV" />
                {fieldState.error && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </TextField>
            )}
          />
          <TextField className="w-full">
            <Label>Tech Stack</Label>
            <Input
              value={Array.isArray(tech) ? tech.join(', ') : ''}
              onChange={(e) => {
                const arr = e.target.value
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean);
                setValue(`projects.${index}.tech`, arr.length ? arr : null);
              }}
              placeholder="React, TypeScript"
            />
            <Description>Comma-separated</Description>
          </TextField>
        </div>

        <Controller
          name={`projects.${index}.bullets.0.text`}
          control={control}
          render={({ field, fieldState }) => (
            <TextField className="w-full" isInvalid={!!fieldState.error}>
              <Label>Description *</Label>
              <TextArea
                {...field}
                value={field.value || ''}
                placeholder="AI-powered resume builder..."
                rows={3}
              />
              {fieldState.error && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </TextField>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name={`projects.${index}.url`}
            control={control}
            render={({ field }) => (
              <TextField className="w-full">
                <Label>Project URL</Label>
                <Input
                  {...field}
                  value={field.value || ''}
                  placeholder="https://..."
                />
              </TextField>
            )}
          />
          <Controller
            name={`projects.${index}.repoUrl`}
            control={control}
            render={({ field }) => (
              <TextField className="w-full">
                <Label>GitHub URL</Label>
                <Input
                  {...field}
                  value={field.value || ''}
                  placeholder="github.com/..."
                />
              </TextField>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name={`projects.${index}.startDate`}
            control={control}
            render={({ field, fieldState }) => (
              <DateField
                value={field.value ? parseDate(`${field.value}-01`) : null}
                onChange={(date) =>
                  field.onChange(date ? date.toString().slice(0, 7) : '')
                }
                isInvalid={!!fieldState.error}
              >
                <Label>Start Date</Label>
                <DateInputGroup>
                  <DateInputGroup.Input>
                    {(segment) => <DateInputGroup.Segment segment={segment} />}
                  </DateInputGroup.Input>
                </DateInputGroup>
                {fieldState.error && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </DateField>
            )}
          />
          <Controller
            name={`projects.${index}.endDate`}
            control={control}
            render={({ field, fieldState }) => (
              <DateField
                value={field.value ? parseDate(`${field.value}-01`) : null}
                onChange={(date) =>
                  field.onChange(date ? date.toString().slice(0, 7) : '')
                }
                isDisabled={!!isCurrent}
                isInvalid={!!fieldState.error}
              >
                <Label>End Date</Label>
                <DateInputGroup>
                  <DateInputGroup.Input>
                    {(segment) => <DateInputGroup.Segment segment={segment} />}
                  </DateInputGroup.Input>
                </DateInputGroup>
                {fieldState.error && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </DateField>
            )}
          />
        </div>

        <Controller
          name={`projects.${index}.isCurrent`}
          control={control}
          render={({ field }) => (
            <Checkbox
              isSelected={!!field.value}
              onChange={(s) => {
                field.onChange(s);
                if (s)
                  setValue(`projects.${index}.endDate`, null, {
                    shouldValidate: true,
                  });
              }}
            >
              <Checkbox.Control className="size-5">
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Content>
                <span className="text-sm">I am currently working on this</span>
              </Checkbox.Content>
            </Checkbox>
          )}
        />
      </Card.Content>
    </Card>
  );
}
