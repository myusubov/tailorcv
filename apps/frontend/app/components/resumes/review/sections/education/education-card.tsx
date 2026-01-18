'use client';

import { useFormContext, Controller, useWatch } from 'react-hook-form';
import {
  Button,
  TextField,
  Label,
  Input,
  FieldError,
  DateField,
  DateInputGroup,
  Tooltip,
  Checkbox,
} from '@heroui/react';
import { parseDate } from '@internationalized/date';
import { Icon } from '@iconify/react';
import type { BaseResumeData } from 'shared';
import { DateSegmentFilter } from '../date-segment-filter';

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
  onMoveDown: () => void;
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
  isFirst,
  isLast,
}: EducationCardProps) {
  const { control, setValue } = useFormContext<BaseResumeData>();
  const basePath = `education.${index}` as const;

  // Watch fields for conditional disabling
  const isCurrent = useWatch({
    control,
    name: `${basePath}.isCurrent`,
  });

  return (
    <div className="border-default-200 space-y-3 rounded-lg border p-4">
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
              className="rounded-full"
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
              className="rounded-full"
            >
              <Icon icon="lucide:arrow-down" className="size-4" />
            </Button>
            <Tooltip.Content>
              <p>Move down</p>
            </Tooltip.Content>
          </Tooltip>

          {/* Remove button */}
          <Tooltip delay={500}>
            <Button
              variant="danger-soft"
              size="sm"
              onPress={onRemove}
              isIconOnly
              className="rounded-full"
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
          render={({ field }) => (
            <TextField className="w-full">
              <Label>Degree</Label>
              <Input
                {...field}
                value={field.value || ''}
                placeholder="Bachelor of Science"
              />
            </TextField>
          )}
        />

        <Controller
          name={`${basePath}.field`}
          control={control}
          render={({ field }) => (
            <TextField className="w-full">
              <Label>Field of Study</Label>
              <Input
                {...field}
                value={field.value || ''}
                placeholder="Computer Science"
              />
            </TextField>
          )}
        />
      </div>

      {/* Location */}
      <Controller
        name={`${basePath}.location`}
        control={control}
        render={({ field }) => (
          <TextField className="w-full">
            <Label>Location</Label>
            <Input
              {...field}
              value={field.value || ''}
              placeholder="City, Country"
            />
          </TextField>
        )}
      />

      {/* Dates */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Controller
          name={`${basePath}.startDate`}
          control={control}
          render={({ field, fieldState }) => (
            <DateField
              className="w-full"
              isInvalid={!!fieldState.error}
              value={field.value ? parseDate(`${field.value}-01`) : null}
              onChange={(date) =>
                field.onChange(date ? date.toString().slice(0, 7) : null)
              }
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
          name={`${basePath}.endDate`}
          control={control}
          render={({ field, fieldState }) => (
            <DateField
              className="w-full"
              isInvalid={!!fieldState.error}
              isDisabled={!!isCurrent}
              value={field.value ? parseDate(`${field.value}-01`) : null}
              onChange={(date) =>
                field.onChange(date ? date.toString().slice(0, 7) : null)
              }
            >
              <Label>End Date / Expected</Label>
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
          name={`${basePath}.isCurrent`}
          control={control}
          render={({ field }) => (
            <Checkbox
              isSelected={!!field.value}
              onChange={(isChecked) => {
                field.onChange(isChecked);
                if (isChecked) {
                  setValue(`${basePath}.endDate`, null);
                }
              }}
              className="pb-2"
            >
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Content>
                <Label className="text-sm font-normal">
                  Currently studying
                </Label>
              </Checkbox.Content>
            </Checkbox>
          )}
        />
      </div>

      {/* Grade */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Controller
          name={`${basePath}.grade`}
          control={control}
          render={({ field }) => (
            <TextField className="w-full">
              <Label>Grade / GPA</Label>
              <Input
                {...field}
                value={field.value || ''}
                placeholder="3.8/4.0 or First Class Honours"
              />
            </TextField>
          )}
        />
      </div>
    </div>
  );
}
