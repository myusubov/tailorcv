'use client';

import React from 'react';
import { DateInputGroup } from '@heroui/react';

/**
 * The segment type extracted from DateInputGroup.Segment props to ensure
 * 100% compatibility with HeroUI's internal types without using 'any'.
 */
export type DateSegment = React.ComponentProps<
  typeof DateInputGroup.Segment
>['segment'];

interface DateSegmentFilterProps {
  /** The date segment to be rendered or filtered */
  segment: DateSegment;
}

/**
 * Reusable component for filtering DateField segments to create a month/year-only input.
 * Hides the 'day' segment and ensures correct rendering of separators.
 *
 * @example
 * <DateField ...>
 *   <DateInputGroup>
 *     <DateInputGroup.Input>
 *       {(segment) => <DateSegmentFilter segment={segment as any} />}
 *     </DateInputGroup.Input>
 *   </DateInputGroup>
 * </DateField>
 */
export function DateSegmentFilter({ segment }: DateSegmentFilterProps) {
  // Hide the day selector to create a month/year picker
  if (segment.type === 'day') {
    return <React.Fragment />;
  }

  return <DateInputGroup.Segment segment={segment} />;
}
