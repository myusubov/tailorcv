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
import type { BaseResumeData } from 'shared';

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
}

const ResumeFormContext = createContext<ResumeFormContextValue | null>(null);

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
  useEffect(() => {
    if (!isDirty) return;

    const timeout = setTimeout(() => {
      saveNow();
    }, 1000);

    return () => clearTimeout(timeout);
  }, [isDirty, saveNow, form.formState]);

  const value = useMemo<ResumeFormContextValue>(
    () => ({
      form,
      isDirty,
      isSaving,
      lastSaved,
      saveNow,
    }),
    [form, isDirty, isSaving, lastSaved, saveNow],
  );

  return (
    <ResumeFormContext.Provider value={value}>
      <FormProvider {...form}>{children}</FormProvider>
    </ResumeFormContext.Provider>
  );
}
