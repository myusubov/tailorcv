'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';

import type {
  GetOnboardingJobOutput,
  GenerateOnboardingOutput,
} from '@/lib/types/onboarding';
import {
  getOnboardingJobStream,
  useOnboardingJobQuery,
} from '@/lib/http/onboarding-client';
import { useStream } from '@/lib/hooks/use-stream';
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
  const [liveJobData, setLiveJobData] = useState<GetOnboardingJobOutput | null>(
    null,
  );
  const [generatedData, setGeneratedData] =
    useState<GenerateOnboardingOutput | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Hybrid Polling/Streaming: We use TanStack Query as an initial fetch and safety fallback.
  const { data: initialJobData, error: jobError } = useOnboardingJobQuery(
    { id: jobId! },
    {
      // We only poll if we don't have active live data yet.
      enabled: !!jobId && !liveJobData,
      refetchInterval: (query) => {
        const job = query.state.data as GetOnboardingJobOutput | undefined;
        if (
          job?.status === 'SUCCEEDED' ||
          job?.status === 'FAILED' ||
          liveJobData
        ) {
          return false;
        }
        return 3000;
      },
    },
  );

  // Computed job data (Live stream takes priority over initial query data)
  const jobData = liveJobData || initialJobData;

  // Memoize params to prevent the stream from reconnecting on every render
  const streamParams = useMemo(() => ({ id: jobId! }), [jobId]);

  // Centralized SSE Stream: Replaces manual fetch/parsing logic
  useStream(getOnboardingJobStream, streamParams, {
    enabled:
      !!jobId &&
      jobData?.status !== 'SUCCEEDED' &&
      jobData?.status !== 'FAILED',
    onData: setLiveJobData,
  });

  // Early persistence cleanup: Clear localStorage as soon as the job is terminal.
  // We keep the state 'jobId' alive to finish our current UI/Data flow.
  useEffect(() => {
    if (jobData?.status === 'SUCCEEDED' || jobData?.status === 'FAILED') {
      clearStoredJobId();
    }
  }, [jobData?.status]);

  const clearJob = () => {
    setJobId(null);
    clearStoredJobId();
  };

  useEffect(() => {
    if (jobError?.status === 404) {
      setTimeout(() => clearJob(), 0);
    }
  }, [jobError]);

  const resumeId = jobData?.resultBaseResumeId;
  const { data: resumeData } = useBaseResumeQuery(
    { id: resumeId ?? '' },
    { enabled: !!resumeId },
  );

  const beginJob = (nextJobId: string) => {
    setGeneratedData(null);
    setShowSuccessModal(false);
    setJobId(nextJobId);
    storeJobId(nextJobId);
  };

  useEffect(() => {
    if (jobData?.status === 'FAILED') {
      showErrorToast(jobData.error);
      setTimeout(() => {
        clearJob();
        setLiveJobData(null);
      }, 0);
    }
  }, [jobData?.status, jobData?.error]);

  useEffect(() => {
    if (resumeData && jobData?.status === 'SUCCEEDED') {
      // Deferring these updates to the next tick to avoid "cascading renders" ESlint warning.
      // This ensures we don't update state synchronously during a render phase.
      setTimeout(() => {
        setGeneratedData({
          baseResumeId: resumeData.id,
          data: resumeData.data,
          meta: { model: 'worker', finishReason: 'STOP' },
        });
        setShowSuccessModal(true);
        setLiveJobData(null);
        clearJob();
      }, 0);
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
