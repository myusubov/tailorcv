'use client';

import {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { useForm, FormProvider, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type BaseResumeData, baseResumeDataSchema, deepMerge } from 'shared';
import { hydrateProposalIds } from '@/lib/utils/hydrateProposalIds';
import { updateResumeAction } from '@/lib/actions/resumes.actions';
import { useActionMutation } from '@/lib/hooks/use-action-mutation';

/**
 * Context value for the resume form state.
 * Provides form controls and save status to all child components.
 */
interface ResumeFormContextValue {
  /** React Hook Form instance managing BaseResumeData */
  form: UseFormReturn<BaseResumeData>;
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** Whether a save operation is in progress */
  isSaving: boolean;
  /** Timestamp of last successful save */
  lastSaved: Date | null;
  /** Trigger a manual save (bypasses debounce) */

  saveNow: () => Promise<void>;
  /** Apply a partial update from AI */
  applyUpdate: (data: unknown) => void;
  /** Revert to previous state */
  undo: () => void;
  /** Whether undo is available */
  canUndo: boolean;
  /** Redo the last undone change */
  redo: () => void;
  /** Whether redo is available */
  canRedo: boolean;
}

export const ResumeFormContext = createContext<ResumeFormContextValue | null>(
  null,
);

/**
 * Hook to access the resume form context.
 * Must be used within a ResumeFormProvider.
 */
export function useResumeForm(): ResumeFormContextValue {
  const context = useContext(ResumeFormContext);
  if (!context) {
    throw new Error('useResumeForm must be used within a ResumeFormProvider');
  }
  return context;
}

/**
 * Optional variant that returns null when outside ResumeFormProvider.
 * Use in components that may render both inside and outside the review page.
 */
export function useResumeFormOptional(): ResumeFormContextValue | null {
  return useContext(ResumeFormContext);
}

interface ResumeFormProviderProps {
  /** Initial resume data from server */
  initialData: BaseResumeData;
  /** Resume ID for PATCH requests */
  resumeId: string;
  /** Child components */
  children: ReactNode;
}

/**
 * Provider component that wraps the review page and manages form state.
 * Handles:
 * - React Hook Form initialization with BaseResumeData
 * - Debounced auto-save to backend (TODO: implement when endpoint ready)
 * - Save status tracking
 */
export function ResumeFormProvider({
  initialData,
  resumeId,
  children,
}: ResumeFormProviderProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const form = useForm<BaseResumeData>({
    resolver: zodResolver(baseResumeDataSchema),
    defaultValues: initialData,
    mode: 'onChange',
  });

  const { mutateAsync: updateResume } = useActionMutation(updateResumeAction, {
    onSuccess: () => {
      setLastSaved(new Date());
      form.reset(form.getValues(), { keepDirty: false }); // Clear dirty state
      setIsSaving(false);
    },
    onError: (error) => {
      console.error('[ResumeFormProvider] Save failed:', error);
      setIsSaving(false);
      form.reset(form.getValues(), { keepDirty: false }); // Clear dirty state
    },
    showErrorToast: false,
  });

  const isDirty = form.formState.isDirty;

  /**
   * Saves the current form data to the backend via server action.
   */
  const saveNow = useCallback(async () => {
    // If we're already saving, don't trigger another identical save
    if (isSaving) return;

    // Check validation state
    const isValid = await form.trigger();
    if (!isValid) {
      console.warn('[ResumeFormProvider] Save aborted: Form is invalid');
      return;
    }

    const data = form.getValues();
    setIsSaving(true);
    updateResume({ id: resumeId, data });
  }, [form, resumeId, isSaving]); // isSaving added to deps

  // Debounced auto-save: save 1.5 seconds after last valid change
  useEffect(() => {
    const isDirty = form.formState.isDirty;
    const isValid = form.formState.isValid;

    console.log({ isDirty });

    console.log({ dirtyFields: form.formState.dirtyFields });
    const original = form.control._defaultValues;
    const current = form.getValues();
    
    const findDiff = (obj1: any, obj2: any, path = 'root') => {
      if (obj1 === obj2) return;
      if (typeof obj1 !== typeof obj2) {
        console.log(`🚨 Type diff at ${path}: original is ${typeof obj1}, current is ${typeof obj2}`);
        return;
      }
      if (obj1 instanceof Date || obj2 instanceof Date) {
         if (obj1?.getTime() !== obj2?.getTime()) console.log(`🚨 Date diff at ${path}`, obj1, obj2);
         return;
      }
      if (typeof obj1 === 'object' && obj1 !== null && obj2 !== null) {
        const keys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
        keys.forEach(key => {
          if (!(key in obj1)) console.log(`🚨 Missing in original at ${path}.${key} (current has:`, obj2[key], `)`);
          else if (!(key in obj2)) console.log(`🚨 Missing in current at ${path}.${key} (original has:`, obj1[key], `)`);
          else findDiff(obj1[key], obj2[key], `${path}.${key}`);
        });
      } else if (obj1 !== obj2) {
        console.log(`🚨 Value diff at ${path}: original is`, obj1, `current is`, obj2);
      }
    };
    findDiff(original, current);
    if (!isDirty || !isValid) return;

    const timeout = setTimeout(() => {
      saveNow();
    }, 1500);

    return () => clearTimeout(timeout);
  }, [form.formState.isDirty, form.formState.isValid, saveNow]);

  const [history, setHistory] = useState<BaseResumeData[]>([]);
  const [future, setFuture] = useState<BaseResumeData[]>([]);

  /**
   * Applies a partial update to the resume data.
   * Saves current state to history for undo.
   */
  const applyUpdate = useCallback(
    (partialData: unknown) => {
      const currentData = form.getValues();

      // Push current state to history (limit to last 10)
      setHistory((prev) => [...prev.slice(-9), currentData]);

      // Clear future stack on new changes (standard undo/redo behavior)
      setFuture([]);

      // Inject IDs into AI proposal arrays before merging.
      // AI proposals omit IDs to save tokens, but the form schema requires them.
      const hydrated = hydrateProposalIds({
        proposal: partialData,
        currentData,
      });
      const newData = deepMerge(currentData, hydrated);

      // Update form
      form.reset(newData, { keepDirty: true });

      // Trigger immediate save for AI apply
      setTimeout(() => {
        saveNow();
      }, 0);
    },
    [form, saveNow],
  );

  /**
   * Reverts the last update from history.
   */
  const undo = useCallback(() => {
    // 1. Check if we can undo
    if (history.length === 0) return;

    // 2. Capture current state
    const currentState = form.getValues();
    const newHistory = [...history];
    const previousState = newHistory.pop();

    if (previousState) {
      // 3. Update generic state (Future)
      setFuture((prev) => [currentState, ...prev]);

      // 4. Update History
      setHistory(newHistory);

      // 5. Update Form
      form.reset(previousState, { keepDirty: true });

      // Trigger immediate save
      setTimeout(() => {
        saveNow();
      }, 0);
    }
  }, [form, history, saveNow]);

  /**
   * Redoes the last undone change.
   */
  const redo = useCallback(() => {
    // 1. Check if we can redo
    if (future.length === 0) return;

    // 2. Capture current state
    const newFuture = [...future];
    const nextState = newFuture.shift();

    if (nextState) {
      // 3. Update specific state (History)
      const currentState = form.getValues();
      setHistory((prev) => [...prev, currentState]);

      // 4. Update Future
      setFuture(newFuture);

      // 5. Update Form
      form.reset(nextState, { keepDirty: true });

      // Trigger immediate save
      setTimeout(() => {
        saveNow();
      }, 0);
    }
  }, [form, future, saveNow]);

  const value = useMemo<ResumeFormContextValue>(
    () => ({
      form,
      isDirty,
      isSaving,
      lastSaved,
      saveNow,
      applyUpdate,
      undo,
      canUndo: history.length > 0,
      redo,
      canRedo: future.length > 0,
    }),
    [
      form,
      isDirty,
      isSaving,
      lastSaved,
      saveNow,
      applyUpdate,
      undo,
      history.length,
      redo,
      future.length,
    ],
  );

  return (
    <ResumeFormContext.Provider value={value}>
      <FormProvider {...form}>{children}</FormProvider>
    </ResumeFormContext.Provider>
  );
}
