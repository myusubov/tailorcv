'use client';

import {
  TextField,
  Label,
  Input,
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
import { parseDate } from '@internationalized/date';

import type { OnboardingFormInput } from '@/lib/schemas/onboarding';

export interface EducationItemContentProps {
  /** Array index of this education item */
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
 * Renders the content of a single education entry card.
 * Handles form fields for school, degree, field of study, dates, and grade.
 */
export function EducationItemContent({
  index,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDelete,
  onDuplicate,
}: EducationItemContentProps) {
  const { control, setValue } = useFormContext<OnboardingFormInput>();
  const isCurrent = useWatch({
    control,
    name: `education.${index}.isCurrent`,
  });
  const startDate = useWatch({
    control,
    name: `education.${index}.startDate`,
  });
  const endDate = useWatch({ control, name: `education.${index}.endDate` });

  return (
    <Card className="mb-4 overflow-visible">
      <Card.Header className="flex-row items-center justify-between">
        <Card.Title className="text-base">Education #{index + 1}</Card.Title>
        <div className="flex items-center gap-1">
          {/* Mobile Reorder Controls */}
          <div className="flex items-center gap-1 lg:hidden">
            <Tooltip delay={500}>
              <Tooltip.Trigger>
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
              </Tooltip.Trigger>
              <Tooltip.Content>
                <p>Move up</p>
              </Tooltip.Content>
            </Tooltip>
            <Tooltip delay={500}>
              <Tooltip.Trigger>
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
              </Tooltip.Trigger>
              <Tooltip.Content>
                <p>Move down</p>
              </Tooltip.Content>
            </Tooltip>
          </div>

          <Tooltip delay={500}>
            <Tooltip.Trigger>
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                onPress={onDuplicate}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon icon="lucide:copy" />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p>Duplicate</p>
            </Tooltip.Content>
          </Tooltip>

          <Tooltip delay={500}>
            <Tooltip.Trigger>
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                onPress={onDelete}
                className="text-danger/50 hover:bg-danger/10 hover:text-danger transition-colors"
              >
                <Icon icon="lucide:trash-2" />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p>Remove education</p>
            </Tooltip.Content>
          </Tooltip>
        </div>
      </Card.Header>

      <Card.Content className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name={`education.${index}.degree`}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                isRequired
                className="w-full"
                isInvalid={!!fieldState.error}
              >
                <Label>Degree / Certification</Label>
                <Input
                  {...field}
                  value={field.value || ''}
                  placeholder="e.g. Bachelor's"
                />
                {fieldState.error ? (
                  <FieldError>{fieldState.error.message}</FieldError>
                ) : null}
              </TextField>
            )}
          />

          <Controller
            name={`education.${index}.field`}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                isRequired
                className="w-full"
                isInvalid={!!fieldState.error}
              >
                <Label>Field of Study</Label>
                <Input
                  {...field}
                  value={field.value || ''}
                  placeholder="e.g. Computer Science"
                />
                {fieldState.error ? (
                  <FieldError>{fieldState.error.message}</FieldError>
                ) : null}
              </TextField>
            )}
          />
        </div>

        <Controller
          name={`education.${index}.school`}
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              isRequired
              className="w-full"
              isInvalid={!!fieldState.error}
            >
              <Label>School / Institution</Label>
              <Input
                {...field}
                value={field.value || ''}
                placeholder="e.g. University of Technology"
              />
              {fieldState.error ? (
                <FieldError>{fieldState.error.message}</FieldError>
              ) : null}
            </TextField>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name={`education.${index}.location`}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                isRequired
                className="w-full"
                isInvalid={!!fieldState.error}
              >
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

          <Controller
            name={`education.${index}.grade`}
            control={control}
            render={({ field, fieldState }) => (
              <TextField className="w-full" isInvalid={!!fieldState.error}>
                <Label>Grade / GPA</Label>
                <Input
                  {...field}
                  value={field.value || ''}
                  placeholder="e.g. 3.8/4.0"
                />
                {fieldState.error ? (
                  <FieldError>{fieldState.error.message}</FieldError>
                ) : null}
              </TextField>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name={`education.${index}.startDate`}
            control={control}
            render={({ field, fieldState }) => (
              <DatePicker
                isRequired
                value={field.value ? parseDate(`${field.value}-01`) : null}
                onChange={(date) =>
                  field.onChange(date ? date.toString().slice(0, 7) : '')
                }
                isInvalid={!!fieldState.error}
              >
                <Label isRequired>Start Date</Label>
                <DateField.Group>
                  <DateField.Input>
                    {(segment) => <DateField.Segment segment={segment} />}
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

          <div className="w-full space-y-2">
            <Controller
              name={`education.${index}.endDate`}
              control={control}
              render={({ field, fieldState }) => (
                <DatePicker
                  className="w-full"
                  value={field.value ? parseDate(`${field.value}-01`) : null}
                  onChange={(date) =>
                    field.onChange(date ? date.toString().slice(0, 7) : '')
                  }
                  isDisabled={!!isCurrent}
                  isInvalid={!!fieldState.error}
                  isRequired={!isCurrent}
                >
                  <Label isRequired={!isCurrent}>Graduation Date</Label>
                  <DateField.Group>
                    <DateField.Input>
                      {(segment) => <DateField.Segment segment={segment} />}
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
              name={`education.${index}.isCurrent`}
              control={control}
              render={({ field }) => (
                <Checkbox
                  isSelected={!!field.value}
                  onChange={(isChecked) => {
                    field.onChange(isChecked);
                    if (isChecked) {
                      setValue(`education.${index}.endDate`, null, {
                        shouldValidate: true,
                      });
                    }
                  }}
                >
                  <Checkbox.Control className="size-5">
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Content>
                    <span className="text-sm">
                      I am currently studying here
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
