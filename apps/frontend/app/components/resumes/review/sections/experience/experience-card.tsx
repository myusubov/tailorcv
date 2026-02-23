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
import { parseDate } from '@internationalized/date';
import { Icon } from '@iconify/react';
import type { BaseResumeData } from 'shared';
import { BulletsEditor } from './bullets-editor';
import { DateSegmentFilter } from '../date-segment-filter';

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
  /** Callback to move this experience down */
  onMoveDown: () => void;
  /** Callback to duplicate this experience */
  onDuplicate: () => void;
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
  onDuplicate,
  isFirst,
  isLast,
}: ExperienceCardProps) {
  const { control, setValue, clearErrors } = useFormContext<BaseResumeData>();
  const basePath = `experiences.${index}` as const;

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
    <div className="border-default-200 space-y-4 rounded-lg border p-4">
      {/* Action toolbar — decoupled from form fields so inputs get full width */}
      <div className="flex items-center justify-between">
        <span className="text-default-400 text-xs font-medium tracking-wide uppercase">
          Experience {index + 1}
        </span>
        <div className="flex items-center gap-1">
          <Tooltip delay={500}>
            <Button
              aria-label="Move experience up"
              onPress={onMoveUp}
              isDisabled={isFirst}
              isIconOnly
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon icon="lucide:arrow-up" className="size-4" />
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
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon icon="lucide:arrow-down" className="size-4" />
            </Button>
            <Tooltip.Content>
              <p>Move down</p>
            </Tooltip.Content>
          </Tooltip>
          <Tooltip delay={500}>
            <Button
              aria-label="Duplicate experience"
              onPress={onDuplicate}
              isIconOnly
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon icon="lucide:copy" className="size-4" />
            </Button>
            <Tooltip.Content>
              <p>Duplicate</p>
            </Tooltip.Content>
          </Tooltip>
          <Tooltip delay={500}>
            <Button
              aria-label="Remove experience"
              variant="ghost"
              size="sm"
              onPress={onRemove}
              isIconOnly
              className="text-danger/50 hover:bg-danger/10 hover:text-danger transition-colors"
            >
              <Icon icon="lucide:trash-2" className="size-4" />
            </Button>
            <Tooltip.Content>
              <p>Remove experience</p>
            </Tooltip.Content>
          </Tooltip>
        </div>
      </div>

      {/* Primary identity fields — full width now that toolbar is a separate row */}
      <div className="grid gap-3 sm:grid-cols-2">
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
              placeholder="City, Country"
            />
            {fieldState.error && (
              <FieldError>{fieldState.error.message}</FieldError>
            )}
          </TextField>
        )}
      />

      {/* Dates — 2-col grid; "Current role" sits below End Date so pickers have room */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Controller
          name={`${basePath}.startDate`}
          control={control}
          render={({ field, fieldState }) => (
            <DatePicker
              className="w-full"
              isInvalid={!!fieldState.error}
              value={field.value ? parseDate(`${field.value}-01`) : null}
              onChange={(date) => {
                field.onChange(date ? date.toString().slice(0, 7) : '');
              }}
            >
              <Label>Start Date *</Label>
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
                  maxValue={endDate ? parseDate(`${endDate}-01`) : undefined}
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

        {/* End Date + "Current role" grouped — checkbox below the picker it controls */}
        <div className="flex flex-col gap-2">
          <Controller
            name={`${basePath}.endDate`}
            control={control}
            render={({ field, fieldState }) => (
              <DatePicker
                className="w-full"
                isInvalid={!!fieldState.error}
                isDisabled={!!isCurrent}
                value={field.value ? parseDate(`${field.value}-01`) : null}
                onChange={(date) =>
                  field.onChange(date ? date.toString().slice(0, 7) : '')
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
                      startDate ? parseDate(`${startDate}-01`) : undefined
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
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Checkbox.Content>
                  <Label className="text-sm font-normal">Current role</Label>
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
