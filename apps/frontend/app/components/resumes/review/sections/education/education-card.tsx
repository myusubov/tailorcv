'use client';

import { useFormContext, Controller, useWatch } from 'react-hook-form';
import {
  Button,
  TextField,
  Label,
  Input,
  FieldError,
  DateField,
  DatePicker,
  Calendar,
  Tooltip,
  Checkbox,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import type { BaseResumeData } from 'shared';
import { DateSegmentFilter } from '../date-segment-filter';
import {
  parseResumeDateValue,
  serializeResumeDateValue,
} from '@/lib/utils/resume-date';

/**
 * Props for the EducationCard component.
 */
interface EducationCardProps {
  /** Index of the education entry in the field array */
  index: number;
  /** Callback to remove this education entry */
  onRemove: () => void;
  /** Callback to move this education up */
  onMoveUp: () => void;
  /** Callback to move this education down */
  /** Callback to move this education down */
  onMoveDown: () => void;
  /** Callback to duplicate this education entry */
  onDuplicate: () => void;
  /** Whether this is the first item */
  isFirst: boolean;
  /** Whether this is the last item */
  isLast: boolean;
}

/**
 * Individual education entry card.
 * Displays school, degree, field of study, location, dates, and grade.
 */
export function EducationCard({
  index,
  onRemove,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  isFirst,
  isLast,
}: EducationCardProps) {
  const { control, setValue, clearErrors } = useFormContext<BaseResumeData>();
  const basePath = `education.${index}` as const;

  // Watch fields for conditional disabling
  const isCurrent = useWatch({
    control,
    name: `${basePath}.isCurrent`,
  });
  const startDate = useWatch({
    control,
    name: `${basePath}.startDate`,
  });
  const endDate = useWatch({ control, name: `${basePath}.endDate` });

  return (
    <div className="border-border space-y-3 rounded-lg border p-4">
      {/* Header with reorder and remove buttons */}
      <div className="flex items-start justify-between gap-2">
        <Controller
          name={`${basePath}.school`}
          control={control}
          render={({ field, fieldState }) => (
            <TextField className="flex-1" isInvalid={!!fieldState.error}>
              <Label>School / University *</Label>
              <Input {...field} placeholder="University name" />
              {fieldState.error && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </TextField>
          )}
        />

        <div className="mt-6 flex items-center gap-1">
          {/* Move up/down buttons */}
          <Tooltip delay={500}>
            <Button
              onPress={onMoveUp}
              isDisabled={isFirst}
              isIconOnly
              variant="ghost"
              size="sm"
              className="text-muted hover:text-foreground rounded-full transition-colors"
            >
              <Icon icon="lucide:arrow-up" className="size-4" />
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
              className="text-muted hover:text-foreground rounded-full transition-colors"
            >
              <Icon icon="lucide:arrow-down" className="size-4" />
            </Button>
            <Tooltip.Content>
              <p>Move down</p>
            </Tooltip.Content>
          </Tooltip>

          {/* Duplicate button */}
          <Tooltip delay={500}>
            <Button
              onPress={onDuplicate}
              isIconOnly
              variant="ghost"
              size="sm"
              className="text-muted hover:text-foreground rounded-full transition-colors"
            >
              <Icon icon="lucide:copy" className="size-4" />
            </Button>
            <Tooltip.Content>
              <p>Duplicate</p>
            </Tooltip.Content>
          </Tooltip>

          {/* Remove button */}
          <Tooltip delay={500}>
            <Button
              variant="ghost"
              size="sm"
              onPress={onRemove}
              isIconOnly
              className="text-danger/50 hover:bg-danger-soft-hover hover:text-danger rounded-full transition-colors"
            >
              <Icon icon="lucide:trash-2" className="size-4" />
            </Button>
            <Tooltip.Content>
              <p>Remove education</p>
            </Tooltip.Content>
          </Tooltip>
        </div>
      </div>

      {/* Degree and Field */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Controller
          name={`${basePath}.degree`}
          control={control}
          render={({ field, fieldState }) => (
            <TextField className="w-full" isInvalid={!!fieldState.error}>
              <Label>Degree</Label>
              <Input
                {...field}
                value={field.value || ''}
                placeholder="e.g. Bachelor of Science"
              />
              {fieldState.error && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </TextField>
          )}
        />

        <Controller
          name={`${basePath}.field`}
          control={control}
          render={({ field, fieldState }) => (
            <TextField className="w-full" isInvalid={!!fieldState.error}>
              <Label>Field of Study</Label>
              <Input
                {...field}
                value={field.value || ''}
                placeholder="e.g. Computer Science"
              />
              {fieldState.error && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </TextField>
          )}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Location */}
        <Controller
          name={`${basePath}.location`}
          control={control}
          render={({ field, fieldState }) => (
            <TextField className="w-full" isInvalid={!!fieldState.error}>
              <Label>Location</Label>
              <Input
                {...field}
                value={field.value || ''}
                placeholder="e.g. London, UK"
              />
              {fieldState.error && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </TextField>
          )}
        />

        {/* Grade */}
        <Controller
          name={`${basePath}.grade`}
          control={control}
          render={({ field, fieldState }) => (
            <TextField className="w-full" isInvalid={!!fieldState.error}>
              <Label>Grade / GPA</Label>
              <Input
                {...field}
                value={field.value || ''}
                placeholder="e.g. 3.8/4.0"
              />
              {fieldState.error && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </TextField>
          )}
        />
      </div>

      {/* Dates */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Controller
          name={`${basePath}.startDate`}
          control={control}
          render={({ field, fieldState }) => (
            <DatePicker
              className="w-full"
              isInvalid={!!fieldState.error}
              value={parseResumeDateValue({ value: field.value })}
              onChange={(date) =>
                field.onChange(serializeResumeDateValue({ value: date }))
              }
            >
              <Label>Start Date</Label>
              <DateField.Group>
                <DateField.Input>
                  {(segment) => <DateSegmentFilter segment={segment as any} />}
                </DateField.Input>
                  <DateField.Suffix>
                    <DatePicker.Trigger>
                      <DatePicker.TriggerIndicator />
                    </DatePicker.Trigger>
                  </DateField.Suffix>
                </DateField.Group>
                <DatePicker.Popover>
                  <Calendar maxValue={parseResumeDateValue({ value: endDate }) ?? undefined}>
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
                        {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                      </Calendar.GridHeader>
                      <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
                    </Calendar.Grid>
                    <Calendar.YearPickerGrid>
                      <Calendar.YearPickerGridBody>
                        {({year}) => <Calendar.YearPickerCell year={year} />}
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
          name={`${basePath}.endDate`}
          control={control}
          render={({ field, fieldState }) => (
            <DatePicker
              className="w-full"
              isInvalid={!!fieldState.error}
              isDisabled={!!isCurrent}
              value={parseResumeDateValue({ value: field.value })}
              onChange={(date) =>
                field.onChange(serializeResumeDateValue({ value: date }))
              }
            >
              <Label>End Date / Expected</Label>
              <DateField.Group>
                <DateField.Input>
                  {(segment) => <DateSegmentFilter segment={segment as any} />}
                </DateField.Input>
                  <DateField.Suffix>
                    <DatePicker.Trigger>
                      <DatePicker.TriggerIndicator />
                    </DatePicker.Trigger>
                  </DateField.Suffix>
                </DateField.Group>
                <DatePicker.Popover>
                  <Calendar minValue={parseResumeDateValue({ value: startDate }) ?? undefined}>
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
                        {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                      </Calendar.GridHeader>
                      <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
                    </Calendar.Grid>
                    <Calendar.YearPickerGrid>
                      <Calendar.YearPickerGridBody>
                        {({year}) => <Calendar.YearPickerCell year={year} />}
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
          name={`${basePath}.isCurrent`}
          control={control}
          render={({ field }) => (
            <Checkbox
              isSelected={!!field.value}
              onChange={(isChecked) => {
                field.onChange(isChecked);
                if (isChecked) {
                  setValue(`${basePath}.endDate`, null);
                  clearErrors(`${basePath}.endDate`);
                }
              }}
              className="pb-2"
            >
              <Checkbox.Content>
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <span className="text-sm font-normal">
                  Currently studying
                </span>
              </Checkbox.Content>
            </Checkbox>
          )}
        />
      </div>
    </div>
  );
}
