'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import type { ApiResult } from '@/lib/api';
import type { GetOnboardingJobOutput, GenerateOnboardingOutput } from '@/lib/types/onboarding';
import type { BaseResume } from '@/lib/types/resumes';

const STORAGE_KEY = 'onboardingJobId';

type OnboardingJobContextValue = {
  jobId: string | null;
  stage: string | null;
  progressPct: number | null;
  isActive: boolean;
  generatedData: GenerateOnboardingOutput | null;
  showSuccessModal: boolean;
  setShowSuccessModal: (open: boolean) => void;
  beginJob: (jobId: string) => void;
  clearJob: () => void;
};

const OnboardingJobContext = createContext<OnboardingJobContextValue | null>(null);

function readStoredJobId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY) ?? null;
}

function storeJobId(jobId: string) {
  localStorage.setItem(STORAGE_KEY, jobId);
}

function clearStoredJobId() {
  localStorage.removeItem(STORAGE_KEY);
}

async function fetchJob(jobId: string) {
  return (await fetch(`/api/onboarding/jobs/${jobId}`, {
    method: 'GET',
    cache: 'no-store',
  })
    .then((r) => r.json())
    .catch(() => null)) as ApiResult<GetOnboardingJobOutput> | null;
}

async function fetchBaseResume(baseResumeId: string) {
  return (await fetch(`/api/resumes/base/${baseResumeId}`, {
    method: 'GET',
    cache: 'no-store',
  })
    .then((r) => r.json())
    .catch(() => null)) as ApiResult<BaseResume> | null;
}

export function OnboardingJobProvider({ children }: { children: React.ReactNode }) {
  const [jobId, setJobId] = useState<string | null>(() => readStoredJobId());
  const [stage, setStage] = useState<string | null>(null);
  const [progressPct, setProgressPct] = useState<number | null>(null);
  const [generatedData, setGeneratedData] = useState<GenerateOnboardingOutput | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const pollingRef = useRef<number | null>(null);

  const clearJob = () => {
    setJobId(null);
    setStage(null);
    setProgressPct(null);
    clearStoredJobId();
  };

  const beginJob = (nextJobId: string) => {
    setGeneratedData(null);
    setShowSuccessModal(false);
    setJobId(nextJobId);
    storeJobId(nextJobId);
  };

  useEffect(() => {
    if (!jobId) return;

    let cancelled = false;
    let inFlight = false;

    const poll = async () => {
      if (inFlight) return;
      inFlight = true;
      const result = await fetchJob(jobId);
      inFlight = false;
      if (cancelled) return;
      if (!result || !result.ok) return;

      setStage(result.data.stage);
      setProgressPct(result.data.progressPct);

      if (result.data.status === 'SUCCEEDED' && result.data.resultBaseResumeId) {
        const baseResumeResult = await fetchBaseResume(result.data.resultBaseResumeId);
        if (!baseResumeResult || !baseResumeResult.ok) {
          toast.error('Resume generated, but failed to load it.');
          clearJob();
          return;
        }

        const baseResume = baseResumeResult.data;
        setGeneratedData({
          baseResumeId: baseResume.id,
          data: baseResume.data,
          meta: { model: 'worker', finishReason: 'STOP' },
        });
        setShowSuccessModal(true);
        clearJob();
        return;
      }

      if (result.data.status === 'FAILED') {
        toast.error(result.data.error?.message ?? 'Failed to generate resume');
        clearJob();
      }
    };

    void poll();
    pollingRef.current = window.setInterval(poll, 1500);

    return () => {
      cancelled = true;
      if (pollingRef.current) window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    };
  }, [jobId]);

  const value = useMemo<OnboardingJobContextValue>(
    () => ({
      jobId,
      stage,
      progressPct,
      isActive: Boolean(jobId),
      generatedData,
      showSuccessModal,
      setShowSuccessModal,
      beginJob,
      clearJob,
    }),
    [jobId, stage, progressPct, generatedData, showSuccessModal],
  );

  return <OnboardingJobContext.Provider value={value}>{children}</OnboardingJobContext.Provider>;
}

export function useOnboardingJob() {
  const ctx = useContext(OnboardingJobContext);
  if (!ctx) throw new Error('useOnboardingJob must be used within OnboardingJobProvider');
  return ctx;
}

