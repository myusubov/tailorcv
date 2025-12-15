export type GetOnboardingStatusInput = {
  clerkUserId: string;
};

export type OnboardingStatus = {
  hasBaseResume: boolean;
  latestBaseResumeId: string | null;
};
