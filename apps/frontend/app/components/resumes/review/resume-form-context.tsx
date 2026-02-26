'use client';

import {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useState,
  useEffect,
  useRef,
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
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const form = useForm<BaseResumeData>({
    resolver: zodResolver(baseResumeDataSchema),
    defaultValues: initialData,
    mode: 'onChange',
  });

  const { mutateAsync: updateResume, isPending: isSaving } = useActionMutation(
    updateResumeAction,
    {
      onSuccess: () => {
        setLastSaved(new Date());
        form.reset(form.getValues(), { keepDirty: false }); // Clear dirty state
      },
      onError: (error) => {
        console.error('[ResumeFormProvider] Save failed:', error);
        // Keep dirty state on error so the watch subscription retries the save.
      },
      showErrorToast: false,
    },
  );

  const isDirty = form.formState.isDirty;

  // Ref for isSaving so saveNow stays referentially stable across save cycles.
  // Without this, saveNow would recreate on every isSaving toggle, destabilizing
  // every callback that depends on it (applyUpdate, undo, redo, the watch effect).
  const isSavingRef = useRef(isSaving);
  isSavingRef.current = isSaving;

  /**
   * Saves the current form data to the backend via server action.
   * Uses isSavingRef instead of isSaving in deps to keep a stable reference.
   */
  const saveNow = useCallback(async () => {
    console.log({ isSavingRef: isSavingRef.current, isDirty: form.formState.isDirty })
    if (isSavingRef.current) return;
    // After onSuccess resets dirty state, this prevents the watch-triggered
    // callback from re-saving. For real changes (typing, append, remove),
    // isDirty is true so the save proceeds.
    if (!form.formState.isDirty) return;

    const isValid = await form.trigger();
    console.log({ isValid, errors: form.formState.errors })
    if (!isValid) {
      console.warn('[ResumeFormProvider] Save aborted: Form is invalid');
      return;
    }

    const data = form.getValues();
    updateResume({ id: resumeId, data });
  }, [form, resumeId, updateResume]);

  // Debounced auto-save using form.watch() for reliable change detection.
  // form.formState.isDirty in useEffect deps doesn't reliably trigger re-runs
  // because RHF's Proxy-based subscriptions only work during render, not in deps.
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const subscription = form.watch(() => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        saveNow();
      }, 1500);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [form, saveNow]);

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
