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

export interface ExperienceItemContentProps {
  /** Array index of this experience item */
  index: number;
  /** Whether this is the first item in the list */
  isFirst: boolean;
  /** Whether this is the last item in the list */
  isLast: boolean;
  /** Callback to move item up in the list */
  onMoveUp: () => void;
  /** Callback to move item down in the list */
  onMoveDown: () => void;
  /** Callback to delete this item */
  /** Callback to delete this item */
  onDelete: () => void;
  /** Callback to duplicate this item */
  onDuplicate: () => void;
}

/**
 * Renders the content of a single experience/job entry card.
 * Handles form fields for title, company, dates, current status, and description.
 */
export function ExperienceItemContent({
  index,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDelete,
  onDuplicate,
}: ExperienceItemContentProps) {
  const { control, setValue } = useFormContext<OnboardingFormInput>();
  const isCurrent = useWatch({
    control,
    name: `experiences.${index}.isCurrent`,
  });

  return (
    <Card className="mb-4 overflow-visible">
      <Card.Header className="flex-row items-center justify-between">
        <Card.Title className="text-base">Job #{index + 1}</Card.Title>
        <div className="flex items-center gap-1">
          {/* Mobile Reorder Controls */}
          <div className="flex items-center gap-1 lg:hidden">
            <Tooltip delay={500}>
              <Button
                onPress={onMoveUp}
                isDisabled={isFirst}
                isIconOnly
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon icon="lucide:arrow-up" />
              </Button>
              <Tooltip.Content>
                <p>Move up</p>
              </Tooltip.Content>
            </Tooltip>
            <Tooltip delay={500}>
              <Button
                onPress={onMoveDown}
                isDisabled={isLast}
                isIconOnly
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon icon="lucide:arrow-down" />
              </Button>
              <Tooltip.Content>
                <p>Move down</p>
              </Tooltip.Content>
            </Tooltip>
          </div>

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
              <p>Remove experience</p>
            </Tooltip.Content>
          </Tooltip>
        </div>
      </Card.Header>

      <Card.Content className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name={`experiences.${index}.title`}
            control={control}
            render={({ field, fieldState }) => (
              <TextField className="w-full" isInvalid={!!fieldState.error}>
                <Label>Job Title *</Label>
                <Input {...field} placeholder="Frontend Developer" />
                {fieldState.error ? (
                  <FieldError>{fieldState.error.message}</FieldError>
                ) : null}
              </TextField>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <Controller
              name={`experiences.${index}.company`}
              control={control}
              render={({ field, fieldState }) => (
                <TextField className="w-full" isInvalid={!!fieldState.error}>
                  <Label>Company *</Label>
                  <Input {...field} placeholder="e.g. Acme Inc." />
                  {fieldState.error ? (
                    <FieldError>{fieldState.error.message}</FieldError>
                  ) : null}
                </TextField>
              )}
            />

            <Controller
              name={`experiences.${index}.location`}
              control={control}
              render={({ field, fieldState }) => (
                <TextField className="w-full" isInvalid={!!fieldState.error}>
                  <Label>Location</Label>
                  <Input
                    {...field}
                    value={field.value || ''}
                    placeholder="e.g. New York, NY"
                  />
                  {fieldState.error ? (
                    <FieldError>{fieldState.error.message}</FieldError>
                  ) : null}
                </TextField>
              )}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name={`experiences.${index}.startDate`}
            control={control}
            render={({ field, fieldState }) => (
              <DateField
                value={field.value ? parseDate(`${field.value}-01`) : null}
                onChange={(date) =>
                  field.onChange(date ? date.toString().slice(0, 7) : '')
                }
                isInvalid={!!fieldState.error}
              >
                <Label>Start Date *</Label>
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
            name={`experiences.${index}.endDate`}
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
          name={`experiences.${index}.isCurrent`}
          control={control}
          render={({ field }) => (
            <Checkbox
              isSelected={!!field.value}
              onChange={(isChecked) => {
                field.onChange(isChecked);
                if (isChecked) {
                  setValue(`experiences.${index}.endDate`, null, {
                    shouldValidate: true,
                  });
                }
              }}
            >
              <Checkbox.Control className="size-5">
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Content>
                <span className="text-sm">I currently work here</span>
              </Checkbox.Content>
            </Checkbox>
          )}
        />

        <Controller
          name={`experiences.${index}.bullets.0.text`}
          control={control}
          render={({ field, fieldState }) => (
            <TextField className="w-full" isInvalid={!!fieldState.error}>
              <Label>What did you do? *</Label>
              <TextArea
                {...field}
                value={field.value || ''}
                placeholder="Led frontend development, built React dashboards, mentored junior devs..."
                rows={3}
              />
              {fieldState.error ? (
                <FieldError>{fieldState.error.message}</FieldError>
              ) : null}
              <Description>
                Write 2-3 sentences. We&apos;ll expand this into professional
                bullet points.
              </Description>
            </TextField>
          )}
        />
      </Card.Content>
    </Card>
  );
}
