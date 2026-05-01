import { render } from '@testing-library/react';
import type { HTMLAttributes } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { ManualEntryStep } from '../../onboarding/types';
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
  it('fails closed for an invalid current step', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    try {
      const { container } = render(
        <ProgressBar currentStep={'invalid-step' as ManualEntryStep} />,
      );

      expect(container.firstChild).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        'Invalid onboarding currentStep supplied to ProgressBar',
        { currentStep: 'invalid-step' },
      );
    } finally {
      warnSpy.mockRestore();
    }
  });
});
