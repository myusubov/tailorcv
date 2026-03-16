'use client';

import { ReviewPageSkeleton } from '@/app/components/resumes/review/review-page-skeleton';
import { ResumeFormProvider } from '@/app/components/resumes/review/resume-form-context';
import { useBaseResumeQuery } from '@/lib/http/resumes-client';
import { notFound, useParams } from 'next/navigation';
import { ReviewPageContent } from '@/app/components/resumes/review/review-page-content';

/**
 * Main review page component.
 * Wraps content in ResumeFormProvider for form state management.
 */
const ResumeReview = () => {
  const { id }: { id: string } = useParams();
  const {
    data: resumeData,
    error,
    isLoading,
  } = useBaseResumeQuery({ id }, { enabled: !!id });


  if (error?.status === 404) {
    notFound();
  }

  if (!resumeData?.data || isLoading) {
    return <ReviewPageSkeleton />;
  }

  return (
    <ResumeFormProvider initialData={resumeData.data} resumeId={id}>
      <ReviewPageContent />
    </ResumeFormProvider>
  );
};

export default ResumeReview;

