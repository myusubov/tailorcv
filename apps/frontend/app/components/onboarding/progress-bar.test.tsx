import { render, screen } from '@testing-library/react';
import type { HTMLAttributes } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ProgressBar } from './progress-bar';

interface MockMotionProps<Element extends HTMLElement>
  extends HTMLAttributes<Element> {
  initial?: unknown;
  animate?: unknown;
  exit?: unknown;
  transition?: unknown;
}

function stripMotionProps<Element extends HTMLElement>({
  initial: _initial,
  animate: _animate,
  exit: _exit,
  transition: _transition,
  ...safeProps
}: MockMotionProps<Element>) {
  return safeProps;
}

vi.mock('framer-motion', () => ({
  motion: {
    div: (props: MockMotionProps<HTMLDivElement>) => (
      <div {...stripMotionProps(props)} />
    ),
    li: (props: MockMotionProps<HTMLLIElement>) => (
      <li {...stripMotionProps(props)} />
    ),
  },
}));

describe('ProgressBar', () => {
  it('shows step context without duplicate percentage or progressbar indicators', () => {
    render(<ProgressBar currentStep="experience" />);

    expect(screen.getAllByText('Experience').length).toBeGreaterThan(0);
    expect(screen.getByText('Step 3')).toBeTruthy();
    expect(screen.getByText('3/5')).toBeTruthy();
    expect(screen.queryByText('60%')).toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });
});
