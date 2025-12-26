'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import type { GenerateOnboardingOutput } from '@/lib/types/onboarding';
import { useOnboardingJobQuery } from '@/lib/http/onboarding-client';
import { useBaseResumeQuery } from '@/lib/http/resumes-client';
import { showErrorToast } from '@/lib/utils/error-toast';

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

const OnboardingJobContext = createContext<OnboardingJobContextValue | null>(
  null,
);

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

export function OnboardingJobProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [jobId, setJobId] = useState<string | null>(() => readStoredJobId());
  const [generatedData, setGeneratedData] =
    useState<GenerateOnboardingOutput | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { data: jobData, error: jobError } = useOnboardingJobQuery(
    { id: jobId! },
    {
      enabled: !!jobId,
      refetchInterval: (query) => {
        const data = query.state.data as typeof jobData;
        if (data?.status === 'SUCCEEDED' || data?.status === 'FAILED') {
          return false;
        }
        return 1500;
      },
      retry: (failureCount, error) => {
        if (error.status === 404) return false;
        return failureCount < 3;
      },
    },
  );

  useEffect(() => {
    if (jobError?.status === 404) {
      clearJob();
    }
  }, [jobError]);

  const resumeId = jobData?.resultBaseResumeId;
  const { data: resumeData } = useBaseResumeQuery(
    { id: resumeId ?? '' },
    { enabled: !!resumeId },
  );

  const clearJob = () => {
    setJobId(null);
    clearStoredJobId();
  };

  const beginJob = (nextJobId: string) => {
    setGeneratedData(null);
    setShowSuccessModal(false);
    setJobId(nextJobId);
    storeJobId(nextJobId);
  };

  useEffect(() => {
    if (jobData?.status === 'FAILED') {
      showErrorToast(jobData.error)
      clearJob();
    }
  }, [jobData?.status, jobData?.error]);

  useEffect(() => {
    if (resumeData && jobData?.status === 'SUCCEEDED') {
      setGeneratedData({
        baseResumeId: resumeData.id,
        data: resumeData.data,
        meta: { model: 'worker', finishReason: 'STOP' },
      });
      setShowSuccessModal(true);
      clearJob();
    }
  }, [resumeData, jobData?.status]);

  const value = useMemo<OnboardingJobContextValue>(
    () => ({
      jobId,
      stage: jobData?.stage ?? null,
      progressPct: jobData?.progressPct ?? null,
      isActive: Boolean(jobId),
      generatedData,
      showSuccessModal,
      setShowSuccessModal,
      beginJob,
      clearJob,
    }),
    [
      jobData?.stage,
      jobData?.progressPct,
      jobId,
      generatedData,
      showSuccessModal,
    ],
  );

  return (
    <OnboardingJobContext.Provider value={value}>
      {children}
    </OnboardingJobContext.Provider>
  );
}

export function useOnboardingJob() {
  const ctx = useContext(OnboardingJobContext);
  if (!ctx)
    throw new Error(
      'useOnboardingJob must be used within OnboardingJobProvider',
    );
  return ctx;
}
