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
  DatePicker,
  Calendar,
  Tooltip,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import type { OnboardingFormInput } from '@/lib/schemas/onboarding';
import { ArrayInput } from '@/app/components/ui';
import {
  parseResumeDateValue,
  serializeResumeDateValue,
} from '@/lib/utils/resume-date';
import { DateClearButton } from './date-clear-button';

export interface ProjectItemContentProps {
  /** Array index of this project item */
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
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDelete,
  onDuplicate,
}: ProjectItemContentProps) {
  const { control, setValue } = useFormContext<OnboardingFormInput>();
  const isCurrent = useWatch({ control, name: `projects.${index}.isCurrent` });
  const startDate = useWatch({ control, name: `projects.${index}.startDate` });
  const endDate = useWatch({ control, name: `projects.${index}.endDate` });
  const isStartDateRequired = !!isCurrent || !!endDate;
  const isEndDateRequired = !!startDate && !isCurrent;

  return (
    <Card className="mb-4">
      <Card.Header className="flex-row items-center justify-between">
        <span
          aria-label={`Project ${index + 1}`}
          className="bg-surface-secondary text-muted flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
        >
          {index + 1}
        </span>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1 lg:hidden">
            <Tooltip delay={500}>
              <Button
                aria-label="Move project up"
                onPress={onMoveUp}
                isDisabled={isFirst}
                isIconOnly
                variant="ghost"
                size="sm"
                className="text-muted hover:text-foreground transition-colors"
              >
                <Icon icon="lucide:arrow-up" />
              </Button>
              <Tooltip.Content>
                <p>Move up</p>
              </Tooltip.Content>
            </Tooltip>
            <Tooltip delay={500}>
              <Button
                aria-label="Move project down"
                onPress={onMoveDown}
                isDisabled={isLast}
                isIconOnly
                variant="ghost"
                size="sm"
                className="text-muted hover:text-foreground transition-colors"
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
              aria-label="Duplicate project"
              isIconOnly
              variant="ghost"
              size="sm"
              onPress={onDuplicate}
              className="text-muted hover:text-foreground transition-colors"
            >
              <Icon icon="lucide:copy" />
            </Button>
            <Tooltip.Content>
              <p>Duplicate</p>
            </Tooltip.Content>
          </Tooltip>
          <Tooltip delay={500}>
            <Button
              aria-label="Remove project"
              isIconOnly
              variant="ghost"
              size="sm"
              onPress={onDelete}
              className="text-danger/50 hover:bg-danger-soft-hover hover:text-danger transition-colors"
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
              <TextField
                isRequired
                className="w-full"
                isInvalid={!!fieldState.error}
              >
                <Label>Project Name</Label>
                <Input {...field} placeholder="e.g. Personal Portfolio" />
                {fieldState.error && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </TextField>
            )}
          />
          <Controller
            name={`projects.${index}.tech`}
            control={control}
            render={({ field }) => (
              <ArrayInput
                label="Tech Stack"
                value={field.value ?? null}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder="e.g. React, Node.js, TypeScript"
                description="Comma-separated"
                className="w-full"
              />
            )}
          />
        </div>

        <Controller
          name={`projects.${index}.bullets.0.text`}
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              isRequired
              className="w-full"
              isInvalid={!!fieldState.error}
            >
              <Label>Description</Label>
              <TextArea
                {...field}
                value={field.value || ''}
                placeholder="Briefly describe what you built and the impact it had..."
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
                  placeholder="https://my-app.vercel.app"
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
                  placeholder="https://github.com/username/repo"
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
              <DatePicker
                value={parseResumeDateValue({ value: field.value })}
                onChange={(date) =>
                  field.onChange(serializeResumeDateValue({ value: date }))
                }
                isRequired={isStartDateRequired}
                isInvalid={!!fieldState.error}
              >
                <Label isRequired={isStartDateRequired}>Start Date</Label>
                <DateField.Group>
                  <DateField.Input>
                    {(segment) => <DateField.Segment segment={segment} />}
                  </DateField.Input>
                  <DateField.Suffix className="flex items-center gap-1">
                    {field.value ? (
                      <DateClearButton
                        label="Clear start date"
                        onClear={() => field.onChange('')}
                      />
                    ) : null}
                    <DatePicker.Trigger>
                      <DatePicker.TriggerIndicator />
                    </DatePicker.Trigger>
                  </DateField.Suffix>
                </DateField.Group>
                <DatePicker.Popover>
                  <Calendar
                    maxValue={
                      parseResumeDateValue({ value: endDate }) ?? undefined
                    }
                  >
                    <Calendar.Header>
                      <Calendar.YearPickerTrigger>
                        <Calendar.YearPickerTriggerHeading />
                        <Calendar.YearPickerTriggerIndicator />
                      </Calendar.YearPickerTrigger>
                      <Calendar.NavButton slot="previous" />
                      <Calendar.NavButton slot="next" />
                    </Calendar.Header>
                    <Calendar.Grid>
                      <Calendar.GridHeader>
                        {(day) => (
                          <Calendar.HeaderCell>{day}</Calendar.HeaderCell>
                        )}
                      </Calendar.GridHeader>
                      <Calendar.GridBody>
                        {(date) => <Calendar.Cell date={date} />}
                      </Calendar.GridBody>
                    </Calendar.Grid>
                    <Calendar.YearPickerGrid>
                      <Calendar.YearPickerGridBody>
                        {({ year }) => <Calendar.YearPickerCell year={year} />}
                      </Calendar.YearPickerGridBody>
                    </Calendar.YearPickerGrid>
                  </Calendar>
                </DatePicker.Popover>
                {fieldState.error && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </DatePicker>
            )}
          />
          <div className="w-full space-y-2">
            <Controller
              name={`projects.${index}.endDate`}
              control={control}
              render={({ field, fieldState }) => (
                <DatePicker
                  className="w-full"
                  isRequired={isEndDateRequired}
                  value={parseResumeDateValue({ value: field.value })}
                  onChange={(date) =>
                    field.onChange(serializeResumeDateValue({ value: date }))
                  }
                  isDisabled={!!isCurrent}
                  isInvalid={!!fieldState.error}
                >
                  <Label isRequired={isEndDateRequired}>End Date</Label>
                  <DateField.Group>
                    <DateField.Input>
                      {(segment) => <DateField.Segment segment={segment} />}
                    </DateField.Input>
                    <DateField.Suffix className="flex items-center gap-1">
                      {field.value ? (
                        <DateClearButton
                          label="Clear end date"
                          onClear={() => field.onChange(null)}
                        />
                      ) : null}
                      <DatePicker.Trigger>
                        <DatePicker.TriggerIndicator />
                      </DatePicker.Trigger>
                    </DateField.Suffix>
                  </DateField.Group>
                  <DatePicker.Popover>
                    <Calendar
                      minValue={
                        parseResumeDateValue({ value: startDate }) ?? undefined
                      }
                    >
                      <Calendar.Header>
                        <Calendar.YearPickerTrigger>
                          <Calendar.YearPickerTriggerHeading />
                          <Calendar.YearPickerTriggerIndicator />
                        </Calendar.YearPickerTrigger>
                        <Calendar.NavButton slot="previous" />
                        <Calendar.NavButton slot="next" />
                      </Calendar.Header>
                      <Calendar.Grid>
                        <Calendar.GridHeader>
                          {(day) => (
                            <Calendar.HeaderCell>{day}</Calendar.HeaderCell>
                          )}
                        </Calendar.GridHeader>
                        <Calendar.GridBody>
                          {(date) => <Calendar.Cell date={date} />}
                        </Calendar.GridBody>
                      </Calendar.Grid>
                      <Calendar.YearPickerGrid>
                        <Calendar.YearPickerGridBody>
                          {({ year }) => (
                            <Calendar.YearPickerCell year={year} />
                          )}
                        </Calendar.YearPickerGridBody>
                      </Calendar.YearPickerGrid>
                    </Calendar>
                  </DatePicker.Popover>
                  {fieldState.error && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </DatePicker>
              )}
            />

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
                  <Checkbox.Content>
                    <Checkbox.Control className="size-5">
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <span className="text-sm">
                      I am currently working on this
                    </span>
                  </Checkbox.Content>
                </Checkbox>
              )}
            />
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
