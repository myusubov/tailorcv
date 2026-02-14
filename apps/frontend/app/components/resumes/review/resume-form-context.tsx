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

  const isDirty = form.formState.isDirty;

  /**
   * Saves the current form data to the backend.
   * TODO: Implement actual PATCH request when endpoint is ready.
   */
  const saveNow = useCallback(async () => {
    const data = form.getValues();
    setIsSaving(true);
    try {
      // TODO: Replace with actual API call
      // await patchResume(resumeId, data);
      console.log('[ResumeFormProvider] Would save:', { resumeId, data });
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network
      setLastSaved(new Date());
      form.reset(data); // Clear dirty state
    } catch (error) {
      console.error('[ResumeFormProvider] Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [form, resumeId]);

  // Debounced auto-save: save 1 second after last change
  /*   useEffect(() => {
    if (!isDirty) return;

    const timeout = setTimeout(() => {
      saveNow();
    }, 1000);

    return () => clearTimeout(timeout);
  }, [isDirty, saveNow, form.formState]);
 */
  const [history, setHistory] = useState<BaseResumeData[]>([]);

  /**
   * Applies a partial update to the resume data.
   * Saves current state to history for undo.
   */
  const applyUpdate = useCallback(
    (partialData: unknown) => {
      const currentData = form.getValues();

      // Push current state to history (limit to last 10)
      setHistory((prev) => [...prev.slice(-9), currentData]);

      // Merge new data
      const newData = deepMerge(currentData, partialData);

      // Update form
      form.reset(newData, { keepDirty: true });

      // Trigger save
      // saveNow();
    },
    [form, saveNow],
  );

  /**
   * Reverts the last update from history.
   */
  const undo = useCallback(() => {
    setHistory((prev) => {
      const newHistory = [...prev];
      const lastState = newHistory.pop();
      if (lastState) {
        form.reset(lastState, { keepDirty: true });
        saveNow();
      }
      return newHistory;
    });
  }, [form, saveNow]);

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
    ],
  );

  return (
    <ResumeFormContext.Provider value={value}>
      <FormProvider {...form}>{children}</FormProvider>
    </ResumeFormContext.Provider>
  );
}
