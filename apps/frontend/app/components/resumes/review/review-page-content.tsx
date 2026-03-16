'use client';

import { useState, useEffect } from 'react';
import { ResumePreview } from '@/app/components/resumes/review/resume-preview';
import { DataAnalysisPanel } from '@/app/components/resumes/review/data-analysis-panel';
import { SmallScreenWarning } from '@/app/components/resumes/review/small-screen-warning';
import { Button, Tooltip } from '@heroui/react';
import { Icon } from '@iconify/react';
import {
  ReviewAccordion,
  type SectionKey,
} from '@/app/components/resumes/review/review-accordion';
import { useResumeForm } from '@/app/components/resumes/review/resume-form-context';
import { useAIChat } from '@/app/providers/ai-chat-provider';
import { useFormContext, useWatch } from 'react-hook-form';
import type { BaseResumeData } from 'shared';

/**
 * Inner content component that has access to form context.
 */
export function ReviewPageContent() {
  const { control } = useFormContext<BaseResumeData>();
  const { applyUpdate, isSaving, lastSaved, undo, redo, canUndo, canRedo, isDirty } =
    useResumeForm();
  const { setCurrentResume, registerApplyUpdate } = useAIChat();

  // Use useWatch for reliable updates to the feedback panel and preview
  const formData = useWatch({ control }) as BaseResumeData;

  // Keep the AI Coach in sync with the current resume data
  useEffect(() => {
    setCurrentResume(formData);
    return () => setCurrentResume(null);
  }, [formData, setCurrentResume]);

  // Register form update function into AI Chat
  useEffect(() => {
    registerApplyUpdate(applyUpdate);
    return () => registerApplyUpdate(null);
  }, [applyUpdate, registerApplyUpdate]);
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
    <div className="relative mx-auto flex w-full max-w-7xl flex-col xl:flex-row">
      <SmallScreenWarning />

      {/* Left Panel - Editor */}
      <div className="border-default-200 w-full min-w-0 shrink-0 border-b p-4 md:p-6 xl:h-screen xl:w-1/2 xl:overflow-y-auto xl:border-r xl:border-b-0">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-foreground text-2xl font-bold">
              Review Your Resume
            </h1>
            {/* Save status indicator */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Tooltip delay={0}>
                  <Tooltip.Trigger>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      isDisabled={!canUndo}
                      onPress={undo}
                      aria-label="Undo"
                    >
                      <Icon
                        icon="solar:undo-left-round-linear"
                        className="text-default-500 size-5"
                      />
                    </Button>
                  </Tooltip.Trigger>
                  <Tooltip.Content>
                    <p className="text-xs font-medium">Undo AI change</p>
                  </Tooltip.Content>
                </Tooltip>
                
                <Tooltip delay={0}>
                  <Tooltip.Trigger>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      isDisabled={!canRedo}
                      onPress={redo}
                      aria-label="Redo"
                    >
                      <Icon
                        icon="solar:undo-right-round-linear"
                        className="text-default-500 size-5"
                      />
                    </Button>
                  </Tooltip.Trigger>
                  <Tooltip.Content>
                    <p className="text-xs font-medium">Redo AI change</p>
                  </Tooltip.Content>
                </Tooltip>
              </div>
              <span className="text-muted text-xs">
                {isSaving
                  ? 'Saving...'
                  : isDirty
                    ? 'Unsaved changes'
                    : lastSaved
                      ? `Saved ${lastSaved.toLocaleTimeString()}`
                      : ''}
              </span>
            </div>
          </div>
          <p className="text-muted text-sm">
            Make sure everything looks good before finalizing.
          </p>
        </div>

        {/* Data Analysis Panel - clickable to expand sections */}
        <DataAnalysisPanel
          data={formData}
          className="bg-card mb-6"
          onSectionClick={handleSectionClick}
          selectedSection={Array.from(expandedKeys)[0] || ''}
        />

        {/* Accordion Editor */}
        <ReviewAccordion
          expandedKeys={expandedKeys}
          onExpandedChange={setExpandedKeys}
          className="mb-6"
        />
      </div>

      {/* Right Panel - Preview (vertical scroll only, no horizontal overflow) */}
      <div className="w-full min-w-0 shrink-0 overflow-x-hidden overflow-y-auto p-4 md:p-6 xl:sticky xl:top-0 xl:h-screen xl:w-1/2">
        <div className="mx-auto w-full max-w-full xl:max-w-none">
          <ResumePreview data={formData} />
        </div>
      </div>
    </div>
  );
}
