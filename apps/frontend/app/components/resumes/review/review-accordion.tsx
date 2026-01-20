'use client';

import { useMemo } from 'react';
import { Accordion, cn } from '@heroui/react';
import { Icon } from '@iconify/react';
import type { BaseResumeData } from 'shared';
import { useResumeAnalysis } from '@/lib/hooks/use-resume-analysis';
import type { AnalysisStatus } from '@/lib/types/resumes';

// Section editors
import {
  ContactEditor,
  SummaryEditor,
  ExperienceEditor,
  ProjectsEditor,
  EducationEditor,
  SkillsEditor,
} from './sections';

/**
 * Section configuration for the accordion.
 * Maps section keys to their display properties and editor components.
 */
const SECTIONS = [
  {
    key: 'contact',
    label: 'Contact',
    icon: 'lucide:user',
    Editor: ContactEditor,
  },
  {
    key: 'summary',
    label: 'Summary',
    icon: 'lucide:align-left',
    Editor: SummaryEditor,
  },
  { key: 'skills', label: 'Skills', icon: 'lucide:tags', Editor: SkillsEditor },
  {
    key: 'experience',
    label: 'Experience',
    icon: 'lucide:briefcase',
    Editor: ExperienceEditor,
  },
  {
    key: 'projects',
    label: 'Projects',
    icon: 'lucide:folder-git-2',
    Editor: ProjectsEditor,
  },
  {
    key: 'education',
    label: 'Education',
    icon: 'lucide:graduation-cap',
    Editor: EducationEditor,
  },
] as const;

type SectionKey = (typeof SECTIONS)[number]['key'];

/**
 * Returns icon and color classes for a given analysis status.
 */
function getStatusStyles(status: AnalysisStatus) {
  switch (status) {
    case 'complete':
      return { colorClass: 'text-success' };
    case 'incomplete':
      return { colorClass: 'text-warning' };
    case 'missing':
      return { colorClass: 'text-danger' };
    default:
      return { colorClass: 'text-default-400' };
  }
}

interface ReviewAccordionProps {
  /** Resume data for analysis status display */
  data: BaseResumeData;
  /** Optional className for the accordion container */
  className?: string;
  /** Controlled expanded keys (for external control like DataAnalysisPanel clicks) */
  expandedKeys?: Set<string>;
  /** Callback when expanded keys change */
  onExpandedChange?: (keys: Set<string>) => void;
}

/**
 * Accordion-based form editor for the resume review page.
 * Each section shows its completion status and expands to reveal the editor.
 */
export function ReviewAccordion({
  data,
  className,
  expandedKeys,
  onExpandedChange,
}: ReviewAccordionProps) {
  const { items: analysisItems } = useResumeAnalysis(data);

  // Map section names to their analysis status
  const statusMap = useMemo(() => {
    const map = new Map<string, AnalysisStatus>();
    analysisItems.forEach((item) => {
      map.set(item.section.toLowerCase(), item.status);
    });
    return map;
  }, [analysisItems]);

  return (
    <Accordion
      variant="surface"
      className={cn('w-full', className)}
      expandedKeys={expandedKeys}
      onExpandedChange={(keys) => onExpandedChange?.(keys as Set<string>)}
    >
      {SECTIONS.map(({ key, label, icon, Editor }) => {
        const isExpanded = expandedKeys?.has(key) || false;
        const status = statusMap.get(key) || 'missing';
        const { colorClass } = getStatusStyles(status);

        return (
          <Accordion.Item key={key} id={key}>
            <Accordion.Heading>
              <Accordion.Trigger className="group/trigger flex w-full items-center gap-3 py-3">
                <div className="flex items-center justify-center">
                  <Icon
                    icon={icon}
                    className={cn(
                      'size-5 transition-colors',
                      colorClass,
                      // On hover or expanded, make it stand out a bit more if it's currently neutral
                      status === 'missing' && 'group-hover/trigger:text-danger',
                      isExpanded ? 'opacity-100' : 'opacity-80',
                    )}
                  />
                </div>
                <span
                  className={cn(
                    'flex-1 text-left text-sm font-medium transition-colors',
                    isExpanded
                      ? 'text-foreground'
                      : 'text-muted-foreground group-hover/trigger:text-foreground',
                  )}
                >
                  {label}
                </span>
                <Accordion.Indicator
                  className={cn(
                    'transition-colors',
                    isExpanded
                      ? 'text-foreground'
                      : 'text-muted-foreground group-hover/trigger:text-foreground',
                  )}
                />
              </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel>
              <Accordion.Body className="pb-4">
                <Editor />
              </Accordion.Body>
            </Accordion.Panel>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
}

export type { SectionKey };
