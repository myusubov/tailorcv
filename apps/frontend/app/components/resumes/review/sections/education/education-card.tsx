'use client';

import { useFormContext, Controller } from 'react-hook-form';
import {
  Button,
  TextField,
  Label,
  Input,
  FieldError,
  DateField,
  DateInputGroup,
} from '@heroui/react';
import { parseDate } from '@internationalized/date';
import { Icon } from '@iconify/react';
import type { BaseResumeData } from 'shared';

/**
 * Props for the EducationCard component.
 */
interface EducationCardProps {
  /** Index of the education entry in the field array */
  index: number;
  /** Callback to remove this education entry */
  onRemove: () => void;
}

/**
 * Individual education entry card.
 * Displays school, degree, field of study, location, dates, and grade.
 */
export function EducationCard({ index, onRemove }: EducationCardProps) {
  const { control } = useFormContext<BaseResumeData>();
  const basePath = `education.${index}` as const;

  return (
    <div className="border-default-200 space-y-3 rounded-lg border p-4">
      {/* Header with remove button */}
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

        <Button
          variant="ghost"
          size="sm"
          onPress={onRemove}
          className="text-danger mt-6"
        >
          <Icon icon="lucide:trash-2" className="size-4" />
        </Button>
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
            </TextField>
          )}
        />

        <Controller
          name={`${basePath}.endDate`}
          control={control}
          render={({ field }) => (
            <TextField className="w-full">
              <Label>End Date / Expected</Label>
              <DateField
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
            </TextField>
          )}
        />
      </div>

      {/* Grade */}
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
  );
}
