'use client';

import { ResumePreview } from '@/app/components/resumes/review/resume-preview';
import { useBaseResumeQuery } from '@/lib/http/resumes-client';
import { useParams } from 'next/navigation';

const ResumeReview = () => {
  const { id }: { id: string } = useParams();

  const { data: resumeData } = useBaseResumeQuery({ id }, { enabled: !!id });

  console.log(resumeData);

  if (!resumeData) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex min-h-svh items-center justify-center overflow-auto p-8">
      <ResumePreview data={resumeData.data} />
    </div>
  );
};

export default ResumeReview;
