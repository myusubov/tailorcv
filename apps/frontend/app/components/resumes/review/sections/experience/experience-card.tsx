'use client';

import { useFormContext, Controller } from 'react-hook-form';
import {
  Button,
  TextField,
  Label,
  Input,
  Checkbox,
  FieldError,
  DateField,
  DateInputGroup,
} from '@heroui/react';
import { parseDate } from '@internationalized/date';
import { Icon } from '@iconify/react';
import type { BaseResumeData } from 'shared';
import { BulletsEditor } from './bullets-editor';

/**
 * Props for the ExperienceCard component.
 */
interface ExperienceCardProps {
  /** Index of the experience in the field array */
  index: number;
  /** Callback to remove this experience */
  onRemove: () => void;
  /** Callback to move this experience up */
  onMoveUp: () => void;
  /** Callback to move this experience down */
  onMoveDown: () => void;
  /** Whether this is the first item */
  isFirst: boolean;
  /** Whether this is the last item */
  isLast: boolean;
}

/**
 * Individual experience card with inline editing.
 * Displays company, title, location, dates, and achievement bullets.
 */
export function ExperienceCard({
  index,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: ExperienceCardProps) {
  const { control, watch } = useFormContext<BaseResumeData>();
  const basePath = `experiences.${index}` as const;
  const isCurrent = watch(`${basePath}.isCurrent`);

  return (
    <div className="border-default-200 space-y-3 rounded-lg border p-4">
      {/* Header with reorder and remove buttons */}
      <div className="flex items-start justify-between gap-2">
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <Controller
            name={`${basePath}.company`}
            control={control}
            render={({ field, fieldState }) => (
              <TextField className="w-full" isInvalid={!!fieldState.error}>
                <Label>Company *</Label>
                <Input {...field} placeholder="Company name" />
                {fieldState.error && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </TextField>
            )}
          />

          <Controller
            name={`${basePath}.title`}
            control={control}
            render={({ field, fieldState }) => (
              <TextField className="w-full" isInvalid={!!fieldState.error}>
                <Label>Title *</Label>
                <Input {...field} placeholder="Job title" />
                {fieldState.error && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </TextField>
            )}
          />
        </div>

        <div className="flex items-center gap-1">
          {/* Move up/down buttons */}
          <Button
            onPress={onMoveUp}
            isDisabled={isFirst}
            isIconOnly
            variant="ghost"
            size="sm"
          >
            <Icon icon="lucide:arrow-up" className="size-4" />
          </Button>
          <Button
            onPress={onMoveDown}
            isDisabled={isLast}
            isIconOnly
            variant="ghost"
            size="sm"
          >
            <Icon icon="lucide:arrow-down" className="size-4" />
          </Button>

          {/* Remove button */}
          <Button
            variant="ghost"
            size="sm"
            onPress={onRemove}
            className="text-danger"
            isIconOnly
          >
            <Icon icon="lucide:trash-2" className="size-4" />
          </Button>
        </div>
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
      <div className="grid items-end gap-3 sm:grid-cols-3">
        <Controller
          name={`${basePath}.startDate`}
          control={control}
          render={({ field, fieldState }) => (
            <TextField className="w-full" isInvalid={!!fieldState.error}>
              <Label>Start Date *</Label>
              <DateField
                value={field.value ? parseDate(`${field.value}-01`) : null}
                onChange={(date) =>
                  field.onChange(date ? date.toString().slice(0, 7) : '')
                }
              >
                <DateInputGroup>
                  <DateInputGroup.Input>
                    {(segment) =>
                      segment.type !== 'day' ? (
                        <DateInputGroup.Segment segment={segment} />
                      ) : (
                        <></>
                      )
                    }
                  </DateInputGroup.Input>
                </DateInputGroup>
              </DateField>
              {fieldState.error && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </TextField>
          )}
        />

        <Controller
          name={`${basePath}.endDate`}
          control={control}
          render={({ field, fieldState }) => (
            <TextField className="w-full" isInvalid={!!fieldState.error}>
              <Label>End Date</Label>
              <DateField
                isDisabled={!!isCurrent}
                value={field.value ? parseDate(`${field.value}-01`) : null}
                onChange={(date) =>
                  field.onChange(date ? date.toString().slice(0, 7) : null)
                }
              >
                <DateInputGroup>
                  <DateInputGroup.Input>
                    {(segment) =>
                      segment.type !== 'day' ? (
                        <DateInputGroup.Segment segment={segment} />
                      ) : (
                        <></>
                      )
                    }
                  </DateInputGroup.Input>
                </DateInputGroup>
              </DateField>
              {fieldState.error && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </TextField>
          )}
        />

        <Controller
          name={`${basePath}.isCurrent`}
          control={control}
          render={({ field }) => (
            <Checkbox
              isSelected={!!field.value}
              onChange={(isChecked) => field.onChange(isChecked)}
              className="pb-2"
            >
              <span className="text-sm">Current role</span>
            </Checkbox>
          )}
        />
      </div>

      {/* Bullets */}
      <BulletsEditor basePath={basePath} />
    </div>
  );
}
