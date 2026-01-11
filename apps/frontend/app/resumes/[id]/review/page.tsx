'use client';

import { ResumePreview } from '@/app/components/resumes/review/resume-preview';
import { DataAnalysisPanel } from '@/app/components/resumes/review/data-analysis-panel';
import { useBaseResumeQuery } from '@/lib/http/resumes-client';
import { useParams } from 'next/navigation';

const ResumeReview = () => {
  const { id }: { id: string } = useParams();

  const { data: resumeData } = useBaseResumeQuery({ id }, { enabled: !!id });

  if (!resumeData) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col xl:flex-row">
      {/* Left Panel - Editor */}
      <div className="min-w-0 w-full shrink-0 border-b border-default-200 p-4 md:p-6 xl:w-1/2 xl:border-b-0 xl:border-r xl:overflow-y-auto xl:h-screen">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Review Your Resume
          </h1>
          <p className="text-sm text-muted">
            Make sure everything looks good before finalizing.
          </p>
        </div>

        {/* Data Analysis Panel */}
        <DataAnalysisPanel data={resumeData.data} className="mb-6" />

        {/* TODO: Accordion sections for editing will go here */}
        <div className="rounded-xl border border-dashed border-default-300 p-8 text-center text-muted">
          <p className="text-sm">Form editor sections coming soon...</p>
        </div>
      </div>

      {/* Right Panel - Preview (vertical scroll only, no horizontal overflow) */}
      <div className="min-w-0 w-full shrink-0 overflow-x-hidden overflow-y-auto p-4 md:p-6 xl:sticky xl:top-0 xl:h-screen xl:w-1/2">
        <ResumePreview data={resumeData.data} />
      </div>
    </div>
  );
};

export default ResumeReview;
