import { useCallback } from 'react';
import {
  useFieldArray,
  useFormContext,
  type FieldValues,
  type FieldArrayPath,
  type FieldArray,
  type UseFieldArrayReturn,
  type Path,
} from 'react-hook-form';

/**
 * Configuration for useStableFieldArray hook
 */
interface UseStableFieldArrayConfig<
  TFieldValues extends FieldValues,
  TFieldArrayName extends FieldArrayPath<TFieldValues>,
> {
  /** The name of the field array in the form */
  name: TFieldArrayName;
}

/**
 * Return type for useStableFieldArray hook
 */
interface UseStableFieldArrayReturn<
  TFieldValues extends FieldValues,
  TFieldArrayName extends FieldArrayPath<TFieldValues>,
> extends Omit<
    UseFieldArrayReturn<TFieldValues, TFieldArrayName>,
    'append' | 'remove'
  > {
  /** Append item using setValue to avoid ghost item bug */
  append: (item: FieldArray<TFieldValues, TFieldArrayName>) => void;
  /** Remove item by index using setValue to avoid ghost item bug */
  remove: (index: number) => void;
}

/**
 * A wrapper around useFieldArray that uses setValue for append/remove operations.
 * This avoids the ghost item bug that occurs when using useFieldArray's native
 * append/remove with AnimatePresence animations.
 *
 * @example
 * ```tsx
 * const { fields, append, remove, move } = useStableFieldArray({
 *   name: 'experiences',
 * });
 * ```
 */
export function useStableFieldArray<
  TFieldValues extends FieldValues,
  TFieldArrayName extends FieldArrayPath<TFieldValues>,
>({
  name,
}: UseStableFieldArrayConfig<
  TFieldValues,
  TFieldArrayName
>): UseStableFieldArrayReturn<TFieldValues, TFieldArrayName> {
  const { control, watch, setValue } = useFormContext<TFieldValues>();

  const fieldArray = useFieldArray({
    control,
    name,
  });

  /**
   * Append an item using setValue to avoid ghost item creation.
   * This bypasses useFieldArray's internal state tracking which can become
   * corrupted when combined with AnimatePresence exit animations.
   */
  const stableAppend = useCallback(
    (item: FieldArray<TFieldValues, TFieldArrayName>) => {
      const current = (watch(name as unknown as Path<TFieldValues>) as unknown[]) || [];
      setValue(
        name as unknown as Path<TFieldValues>,
        [...current, item] as TFieldValues[TFieldArrayName],
      );
    },
    [name, watch, setValue],
  );

  /**
   * Remove an item by index using setValue to avoid ghost item creation.
   */
  const stableRemove = useCallback(
    (index: number) => {
      const current = (watch(name as unknown as Path<TFieldValues>) as unknown[]) || [];
      setValue(
        name as unknown as Path<TFieldValues>,
        current.filter((_, i) => i !== index) as TFieldValues[TFieldArrayName],
      );
    },
    [name, watch, setValue],
  );

  return {
    ...fieldArray,
    append: stableAppend,
    remove: stableRemove,
  };
}
