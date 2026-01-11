'use client';

import { Icon } from '@iconify/react';
import { cn } from '@heroui/react';
import type { BaseResumeData } from 'shared';
import type { AnalysisStatus } from '@/lib/types/resumes';
import { useResumeAnalysis } from '@/lib/hooks/use-resume-analysis';

interface DataAnalysisPanelProps {
  data: BaseResumeData;
  className?: string;
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
 */
export function DataAnalysisPanel({ data, className }: DataAnalysisPanelProps) {
  const { items, progressPct } = useResumeAnalysis(data);

  return (
    <div
      className={cn(
        'rounded-xl border border-default-200 bg-default-50 p-4',
        className,
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Resume Completeness
        </h3>
        <span className="text-xs text-muted">{progressPct}% Complete</span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Analysis Items */}
      <div className="space-y-2">
        {items.map((item) => {
          const { icon, colorClass, bgClass } = getStatusIcon(item.status);
          return (
            <div
              key={item.section}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                bgClass,
              )}
            >
              <Icon icon={icon} className={cn('size-4 shrink-0', colorClass)} />
              <span className="flex-1 text-sm font-medium text-foreground">
                {item.section}
              </span>
              <span className="text-xs text-muted">{item.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
