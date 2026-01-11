'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { cn } from '@heroui/react';
import type { BaseResumeData } from 'shared';
import type { AnalysisStatus } from '@/lib/types/resumes';
import { useResumeAnalysis } from '@/lib/hooks/use-resume-analysis';

interface DataAnalysisPanelProps {
  data: BaseResumeData;
  className?: string;
  /** Callback when a section item is clicked */
  onSectionClick?: (section: string) => void;
  /** Currently selected/expanded section key */
  selectedSection?: string;
}

/**
 * Returns the appropriate icon and color classes for a given analysis status.
 */
function getStatusIcon(status: AnalysisStatus) {
  switch (status) {
    case 'complete':
      return {
        icon: 'lucide:check-circle-2',
        colorClass: 'text-success',
        bgClass: 'bg-success/10',
      };
    case 'incomplete':
      return {
        icon: 'lucide:alert-circle',
        colorClass: 'text-warning',
        bgClass: 'bg-warning/10',
      };
    case 'missing':
      return {
        icon: 'lucide:x-circle',
        colorClass: 'text-danger',
        bgClass: 'bg-danger/10',
      };
  }
}

/**
 * DataAnalysisPanel component displays the completeness status of each resume section.
 * It provides visual feedback on what is complete, incomplete, or missing.
 * Items are clickable to expand the corresponding accordion section.
 */
export function DataAnalysisPanel({
  data,
  className,
  onSectionClick,
  selectedSection,
}: DataAnalysisPanelProps) {
  const { items, progressPct } = useResumeAnalysis(data);
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div
      className={cn(
        'border-default-200 bg-default-50 rounded-xl border p-4',
        className,
      )}
    >
      {/* Header - Clickable to toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="mb-3 flex w-full items-center justify-between transition-opacity hover:opacity-80"
      >
        <h3 className="text-foreground text-sm font-semibold">
          Resume Completeness
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-muted text-xs">{progressPct}% Complete</span>
          <Icon
            icon="lucide:chevron-down"
            className={cn(
              'text-muted size-4 transition-transform duration-300',
              isExpanded ? 'rotate-180' : '',
            )}
          />
        </div>
      </button>

      {/* Progress Bar - Always visible */}
      <div className="bg-secondary mb-4 h-1.5 w-full overflow-hidden rounded-full">
        <div
          className="bg-primary h-full transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Analysis Items - Collapsible with animation */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="analysis-items"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="-m-0.5 overflow-hidden p-0.5"
          >
            <div className="space-y-2">
              {items.map((item) => {
                const { icon, colorClass, bgClass } = getStatusIcon(
                  item.status,
                );
                const isSelected =
                  selectedSection?.toLowerCase() === item.section.toLowerCase();

                return (
                  <button
                    key={item.section}
                    type="button"
                    onClick={() => onSectionClick?.(item.section)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                      'hover:ring-primary/30 cursor-pointer hover:ring-2',
                      bgClass,
                      // Selected state comes LAST to override bgClass
                      isSelected && 'ring-primary/50 ring-2',
                    )}
                  >
                    <Icon
                      icon={icon}
                      className={cn('size-4 shrink-0', colorClass)}
                    />
                    <span className="text-foreground flex-1 text-sm font-medium">
                      {item.section}
                    </span>
                    <span className="text-muted text-xs">{item.message}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
