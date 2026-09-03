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
  DatePicker,
  Calendar,
  Tooltip,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import type { BaseResumeData } from 'shared';
import { BulletsEditor } from '../experience';
import { DateSegmentFilter } from '../date-segment-filter';
import {
  parseResumeDateValue,
  serializeResumeDateValue,
} from '@/lib/utils/resume-date';
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
  /** Callback to move this project down */
  onMoveDown: () => void;
  /** Callback to duplicate this project */
  onDuplicate: () => void;
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
  onDuplicate,
  isFirst,
  isLast,
}: ProjectCardProps) {
  const { control, setValue, clearErrors } = useFormContext<BaseResumeData>();
  const basePath = `projects.${index}` as const;

  // Use useWatch for reactive updates to checkbox state
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
    <div className="border-border space-y-4 rounded-lg border p-4">
      {/* Action toolbar — decoupled from form fields so inputs get full width */}
      <div className="flex items-center justify-between">
        <span className="text-muted text-xs font-medium tracking-wide uppercase">
          Project {index + 1}
        </span>
        <div className="flex items-center gap-1">
          <Tooltip delay={500}>
            <Button
              aria-label="Move project up"
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
              aria-label="Move project down"
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
          <Tooltip delay={500}>
            <Button
              aria-label="Duplicate project"
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
          <Tooltip delay={500}>
            <Button
              aria-label="Remove project"
              variant="ghost"
              size="sm"
              onPress={onRemove}
              isIconOnly
              className="text-danger/50 hover:bg-danger-soft-hover hover:text-danger rounded-full transition-colors"
            >
              <Icon icon="lucide:trash-2" className="size-4" />
            </Button>
            <Tooltip.Content>
              <p>Remove project</p>
            </Tooltip.Content>
          </Tooltip>
        </div>
      </div>

      {/* Primary identity fields — full width now that toolbar is a separate row */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Controller
          name={`${basePath}.name`}
          control={control}
          render={({ field, fieldState }) => (
            <TextField className="w-full" isInvalid={!!fieldState.error}>
              <Label>Project Name *</Label>
              <Input {...field} placeholder="e.g. Personal Portfolio" />
              {fieldState.error && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </TextField>
          )}
        />
        <Controller
          name={`${basePath}.role`}
          control={control}
          render={({ field, fieldState }) => (
            <TextField className="w-full" isInvalid={!!fieldState.error}>
              <Label>Your Role</Label>
              <Input
                {...field}
                value={field.value || ''}
                placeholder="e.g. Full Stack Developer"
              />
              {fieldState.error && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </TextField>
          )}
        />
      </div>

      {/* URLs */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Controller
          name={`${basePath}.url`}
          control={control}
          render={({ field, fieldState }) => (
            <TextField className="w-full" isInvalid={!!fieldState.error}>
              <Label>Live URL</Label>
              <Input
                {...field}
                value={field.value || ''}
                placeholder="https://my-app.vercel.app"
              />
              {fieldState.error && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </TextField>
          )}
        />

        <Controller
          name={`${basePath}.repoUrl`}
          control={control}
          render={({ field, fieldState }) => (
            <TextField className="w-full" isInvalid={!!fieldState.error}>
              <Label>Repository URL</Label>
              <Input
                {...field}
                value={field.value || ''}
                placeholder="https://github.com/username/repo"
              />
              {fieldState.error && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </TextField>
          )}
        />
      </div>

      {/* Dates — 2-col grid; "Active project" sits below End Date so pickers have room */}
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

        {/* End Date + "Active project" grouped — checkbox below the picker it controls */}
        <div className="flex flex-col gap-2">
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
                <Label>End Date</Label>
                <DateField.Group>
                  <DateField.Input>
                    {(segment) => (
                      <DateSegmentFilter segment={segment as any} />
                    )}
                  </DateField.Input>
                  <DateField.Suffix>
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
              >
                <Checkbox.Content>
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <span className="text-sm font-normal">Active project</span>
                </Checkbox.Content>
              </Checkbox>
            )}
          />
        </div>
      </div>

      {/* Bullets */}
      <BulletsEditor basePath={basePath} />
    </div>
  );
}
