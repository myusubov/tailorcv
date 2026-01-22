'use client';

import { useFormContext, Controller } from 'react-hook-form';
import {
  Button,
  TextArea,
  Tooltip,
  TextField,
  FieldError,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { Reorder, useDragControls } from 'framer-motion';

/**
 * Interface representing a single bullet point structure.
 */
interface BulletField {
  id: string;
  text: string;
}

/**
 * Props for the BulletItem component.
 */
interface BulletItemProps {
  /** The field object from useFieldArray */
  field: BulletField;
  /** The base path for the field array (e.g., 'experiences.0' or 'projects.1') */
  basePath: string;
  /** The index of the bullet in the array */
  bulletIndex: number;
  /** Callback to remove the bullet point */
  onRemove: () => void;
}

/**
 * Individual bullet item with drag handle and text area.
 * Modularized for use within BulletsEditor's Reorder.Group.
 */
export function BulletItem({
  field,
  basePath,
  bulletIndex,
  onRemove,
}: BulletItemProps) {
  const { control } = useFormContext();
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={field}
      dragListener={false}
      dragControls={controls}
      className="flex items-start gap-1"
    >
      <div
        onPointerDown={(e) => controls.start(e)}
        className="hover:bg-default-100 mt-2.5 cursor-grab rounded p-0.5 transition-colors active:cursor-grabbing"
        title="Drag to reorder"
      >
        <Icon
          icon="lucide:grip-vertical"
          className="text-muted hover:text-foreground size-3.5 transition-colors"
        />
      </div>

      <Controller
        name={`${basePath}.bullets.${bulletIndex}.text`}
        control={control}
        render={({
          field: { name, value, onChange, onBlur, ref },
          fieldState,
        }) => (
          <TextField
            isInvalid={!!fieldState.error}
            name={name}
            value={value}
            onChange={onChange}
            className="flex-1"
          >
            <TextArea
              ref={ref}
              onBlur={onBlur}
              placeholder="Describe an achievement or responsibility..."
              className="min-h-[60px] w-full"
            />
            <FieldError>{fieldState.error?.message}</FieldError>
          </TextField>
        )}
      />

      <Tooltip delay={500}>
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          onPress={onRemove}
          className="text-danger/50 hover:text-danger mt-1"
        >
          <Icon icon="lucide:x" className="size-4" />
        </Button>
        <Tooltip.Content>
          <p>Remove bullet point</p>
        </Tooltip.Content>
      </Tooltip>
    </Reorder.Item>
  );
}
