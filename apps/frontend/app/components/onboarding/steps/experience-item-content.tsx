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
import {
  parseResumeDateValue,
  serializeResumeDateValue,
} from '@/lib/utils/resume-date';
import { DateClearButton } from './date-clear-button';

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
  const startDate = useWatch({
    control,
    name: `experiences.${index}.startDate`,
  });
  const endDate = useWatch({ control, name: `experiences.${index}.endDate` });

  return (
    <Card className="mb-4 overflow-visible">
      <Card.Header className="flex-row items-center justify-between">
        <span
          aria-label={`Experience ${index + 1}`}
          className="bg-surface-secondary text-muted flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
        >
          {index + 1}
        </span>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1 lg:hidden">
            <Tooltip delay={500}>
              <Button
                aria-label="Move experience up"
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
                aria-label="Move experience down"
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
              aria-label="Duplicate experience"
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
              aria-label="Remove experience"
              isIconOnly
              variant="ghost"
              size="sm"
              onPress={onDelete}
              className="text-danger/50 hover:bg-danger-soft-hover hover:text-danger transition-colors"
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
              <TextField
                isRequired
                className="w-full"
                isInvalid={!!fieldState.error}
              >
                <Label>Job Title</Label>
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
                <TextField
                  isRequired
                  className="w-full"
                  isInvalid={!!fieldState.error}
                >
                  <Label>Company</Label>
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
              <DatePicker
                isRequired
                value={parseResumeDateValue({ value: field.value })}
                onChange={(date) =>
                  field.onChange(serializeResumeDateValue({ value: date }))
                }
                isInvalid={!!fieldState.error}
              >
                <Label isRequired>Start Date</Label>
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
              name={`experiences.${index}.endDate`}
              control={control}
              render={({ field, fieldState }) => (
                <DatePicker
                  className="w-full"
                  isRequired={!isCurrent}
                  value={parseResumeDateValue({ value: field.value })}
                  onChange={(date) =>
                    field.onChange(serializeResumeDateValue({ value: date }))
                  }
                  isDisabled={!!isCurrent}
                  isInvalid={!!fieldState.error}
                >
                  <Label isRequired={!isCurrent}>End Date</Label>
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
                        parseResumeDateValue({ value: startDate }) ??
                        undefined
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
                  <Checkbox.Content>
                    <Checkbox.Control className="size-5">
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <span className="text-sm">I currently work here</span>
                  </Checkbox.Content>
                </Checkbox>
              )}
            />
          </div>
        </div>

        <Controller
          name={`experiences.${index}.bullets.0.text`}
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              isRequired
              className="w-full"
              isInvalid={!!fieldState.error}
            >
              <Label>What did you do?</Label>
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
