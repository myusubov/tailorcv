'use client';

import { useFormContext, Controller, useWatch } from 'react-hook-form';
import {
  Button,
  TextField,
  Label,
  Input,
  Checkbox,
  FieldError,
  DateField,
  DateInputGroup,
  Tooltip,
} from '@heroui/react';
import { parseDate } from '@internationalized/date';
import { Icon } from '@iconify/react';
import type { BaseResumeData } from 'shared';
import { BulletsEditor } from '../experience';
import { DateSegmentFilter } from '../date-segment-filter';
/**
 * Props for the ProjectCard component.
 */
interface ProjectCardProps {
  /** Index of the project in the field array */
  index: number;
  /** Callback to remove this project */
  onRemove: () => void;
  /** Callback to move this project up */
  onMoveUp: () => void;
  /** Callback to move this project down */
  onMoveDown: () => void;
  /** Whether this is the first item */
  isFirst: boolean;
  /** Whether this is the last item */
  isLast: boolean;
}

/**
 * Individual project card with inline editing.
 * Displays project name, role, URLs, dates, and achievement bullets.
 */
export function ProjectCard({
  index,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: ProjectCardProps) {
  const { control } = useFormContext<BaseResumeData>();
  const basePath = `projects.${index}` as const;

  // Use useWatch for reactive updates to checkbox state
  const isCurrent = useWatch({
    control,
    name: `${basePath}.isCurrent`,
  });

  return (
    <div className="border-default-200 space-y-3 rounded-lg border p-4">
      {/* Header with reorder and remove buttons */}
      <div className="flex items-start justify-between gap-2">
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <Controller
            name={`${basePath}.name`}
            control={control}
            render={({ field, fieldState }) => (
              <TextField className="w-full" isInvalid={!!fieldState.error}>
                <Label>Project Name *</Label>
                <Input {...field} placeholder="Project name" />
                {fieldState.error && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </TextField>
            )}
          />

          <Controller
            name={`${basePath}.role`}
            control={control}
            render={({ field }) => (
              <TextField className="w-full">
                <Label>Your Role</Label>
                <Input
                  {...field}
                  value={field.value || ''}
                  placeholder="Lead Developer"
                />
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
            className="rounded-full"
          >
            <Icon icon="lucide:arrow-up" className="size-4" />
          </Button>
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
              <p>Remove project</p>
            </Tooltip.Content>
          </Tooltip>
        </div>
      </div>

      {/* URLs */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Controller
          name={`${basePath}.url`}
          control={control}
          render={({ field }) => (
            <TextField className="w-full">
              <Label>Live URL</Label>
              <Input
                {...field}
                value={field.value || ''}
                placeholder="https://..."
              />
            </TextField>
          )}
        />

        <Controller
          name={`${basePath}.repoUrl`}
          control={control}
          render={({ field }) => (
            <TextField className="w-full">
              <Label>Repository URL</Label>
              <Input
                {...field}
                value={field.value || ''}
                placeholder="github.com/..."
              />
            </TextField>
          )}
        />
      </div>

      {/* Dates */}
      <div className="grid items-end gap-3 sm:grid-cols-3">
        <Controller
          name={`${basePath}.startDate`}
          control={control}
          render={({ field }) => (
            <TextField className="w-full">
              <Label>Start Date</Label>
              <DateField
                value={field.value ? parseDate(`${field.value}-01`) : null}
                onChange={(date) =>
                  field.onChange(date ? date.toString().slice(0, 7) : null)
                }
              >
                <DateInputGroup>
                  <DateInputGroup.Input>
                    {(segment) => <DateSegmentFilter segment={segment} />}
                  </DateInputGroup.Input>
                </DateInputGroup>
              </DateField>
            </TextField>
          )}
        />

        <Controller
          name={`${basePath}.endDate`}
          control={control}
          render={({ field }) => (
            <TextField className="w-full">
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
                    {(segment) => <DateSegmentFilter segment={segment} />}
                  </DateInputGroup.Input>
                </DateInputGroup>
              </DateField>
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
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Content>
                <Label className="text-sm font-normal">Active project</Label>
              </Checkbox.Content>
            </Checkbox>
          )}
        />
      </div>

      {/* Bullets */}
      <BulletsEditor basePath={basePath} />
    </div>
  );
}
