export type GetOnboardingStatusInput = {
  params: {
    userId: string;
  };
};

export type GetOnboardingStatusOutput = {
  hasBaseResume: boolean;
  latestBaseResumeId: string | null;
};
