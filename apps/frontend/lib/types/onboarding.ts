export type GetOnboardingStatusInput = {
  params: {
    userId: string;
  };
};

export type GetOnboardingStatusOutput = {
  onboardingCompletedAt: string | null;
};
