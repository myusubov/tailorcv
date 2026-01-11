'use client';

import { useState } from 'react';
import { ResumePreview } from '@/app/components/resumes/review/resume-preview';
import { DataAnalysisPanel } from '@/app/components/resumes/review/data-analysis-panel';
import {
  ReviewAccordion,
  type SectionKey,
} from '@/app/components/resumes/review/review-accordion';
import {
  ResumeFormProvider,
  useResumeForm,
} from '@/app/components/resumes/review/resume-form-context';
import { useBaseResumeQuery } from '@/lib/http/resumes-client';
import { useParams } from 'next/navigation';
import { useFormContext } from 'react-hook-form';
import type { BaseResumeData } from 'shared';

/**
 * Main review page component.
 * Wraps content in ResumeFormProvider for form state management.
 */
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
    <ResumeFormProvider initialData={resumeData.data} resumeId={id}>
      <ReviewPageContent />
    </ResumeFormProvider>
  );
};

/**
 * Inner content component that has access to form context.
 */
function ReviewPageContent() {
  const { watch } = useFormContext<BaseResumeData>();
  const { isSaving, lastSaved } = useResumeForm();

  // Watch all form values for live preview updates
  const formData = watch();

  // Accordion expanded state
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  /**
   * Handles section clicks from DataAnalysisPanel.
   * Expands the corresponding accordion section.
   */
  const handleSectionClick = (section: string) => {
    // Map analysis section names to accordion keys
    const keyMap: Record<string, SectionKey> = {
      contact: 'contact',
      summary: 'summary',
      skills: 'skills',
      experience: 'experience',
      projects: 'projects',
      education: 'education',
    };
    const key = keyMap[section.toLowerCase()];

    if (key) {
      // Toggle: if already expanded, collapse it; otherwise expand it
      if (expandedKeys.has(key)) {
        const newKeys = new Set(expandedKeys);
        newKeys.delete(key);
        setExpandedKeys(newKeys);
      } else {
        setExpandedKeys(new Set([key]));
      }
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col xl:flex-row">
      {/* Left Panel - Editor */}
      <div className="border-default-200 w-full min-w-0 shrink-0 border-b p-4 md:p-6 xl:h-screen xl:w-1/2 xl:overflow-y-auto xl:border-r xl:border-b-0">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-foreground text-2xl font-bold">
              Review Your Resume
            </h1>
            {/* Save status indicator */}
            <span className="text-muted text-xs">
              {isSaving
                ? 'Saving...'
                : lastSaved
                  ? `Saved ${lastSaved.toLocaleTimeString()}`
                  : ''}
            </span>
          </div>
          <p className="text-muted text-sm">
            Make sure everything looks good before finalizing.
          </p>
        </div>

        {/* Data Analysis Panel - clickable to expand sections */}
        <DataAnalysisPanel
          data={formData}
          className="mb-6"
          onSectionClick={handleSectionClick}
          selectedSection={Array.from(expandedKeys)[0] || ''}
        />

        {/* Accordion Editor */}
        <ReviewAccordion
          data={formData}
          expandedKeys={expandedKeys}
          onExpandedChange={setExpandedKeys}
          className="mb-6"
        />
      </div>

      {/* Right Panel - Preview (vertical scroll only, no horizontal overflow) */}
      <div className="w-full min-w-0 shrink-0 overflow-x-hidden overflow-y-auto p-4 md:p-6 xl:sticky xl:top-0 xl:h-screen xl:w-1/2">
        <ResumePreview data={formData} />
      </div>
    </div>
  );
}

export default ResumeReview;
