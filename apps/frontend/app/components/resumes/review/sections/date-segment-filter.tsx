'use client';

import React from 'react';
import { DateField } from '@heroui/react';

/**
 * The segment type extracted from DateInputGroup.Segment props to ensure
 * 100% compatibility with HeroUI's internal types without using 'any'.
 */
export type DateSegment = React.ComponentProps<
  typeof DateField.Segment
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
 *   <DateField.Group>
 *     <DateField.Input>
 *       {(segment) => <DateSegmentFilter segment={segment as any} />}
 *     </DateField.Input>
 *   </DateField.Group>
 * </DateField>
 */
export function DateSegmentFilter({ segment }: DateSegmentFilterProps) {

  return <DateField.Segment segment={segment} />;
}
