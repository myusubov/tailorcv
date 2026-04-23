import { render, screen } from '@testing-library/react';
import type { HTMLAttributes } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ProgressBar } from './progress-bar';

vi.mock('framer-motion', () => ({
  motion: {
    div: (props: HTMLAttributes<HTMLDivElement>) => <div {...props} />,
    li: (props: HTMLAttributes<HTMLLIElement>) => <li {...props} />,
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
