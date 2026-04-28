import { render, screen } from '@testing-library/react';
import type { HTMLAttributes, ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import type { OnboardingFormInput } from '@/lib/schemas/onboarding';
import { EducationStep } from './education-step';

interface MockMotionProps<
  Element extends HTMLElement,
> extends HTMLAttributes<Element> {
  initial?: unknown;
  animate?: unknown;
  exit?: unknown;
  transition?: unknown;
  layout?: boolean;
}

interface AnimatePresenceProps {
  children: ReactNode;
}

interface RenderEducationStepArgs {
  education?: OnboardingFormInput['education'];
}

function stripMotionProps<Element extends HTMLElement>({
  initial: _initial,
  animate: _animate,
  exit: _exit,
  transition: _transition,
  layout: _layout,
  ...safeProps
}: MockMotionProps<Element>) {
  return safeProps;
}

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: AnimatePresenceProps) => <>{children}</>,
  motion: {
    div: (props: MockMotionProps<HTMLDivElement>) => (
      <div {...stripMotionProps(props)} />
    ),
    h2: (props: MockMotionProps<HTMLHeadingElement>) => (
      <h2 {...stripMotionProps(props)} />
    ),
    p: (props: MockMotionProps<HTMLParagraphElement>) => (
      <p {...stripMotionProps(props)} />
    ),
  },
}));

function EducationStepHarness({ education = [] }: RenderEducationStepArgs) {
  const form = useForm<OnboardingFormInput>({
    defaultValues: {
      version: 1,
      contact: {
        firstName: 'Sarah',
        lastName: 'Chen',
        headline: null,
        email: 'sarah.chen@example.com',
        phone: null,
        location: null,
        websiteUrl: null,
        linkedinUrl: null,
        githubUrl: null,
      },
      summary: null,
      skills: [],
      experiences: [],
      projects: [],
      education,
      certifications: [],
      languages: [],
    },
  });

  return (
    <FormProvider {...form}>
      <EducationStep onFinish={vi.fn()} onBack={vi.fn()} />
    </FormProvider>
  );
}

function renderEducationStep(args: RenderEducationStepArgs = {}) {
  return render(<EducationStepHarness {...args} />);
}

describe('EducationStep', () => {
  it('renders a concise empty state without duplicate completion messaging', () => {
    renderEducationStep();

    expect(screen.getByRole('heading', { name: 'Education' })).toBeTruthy();
    expect(
      screen.getByText(
        'Education is optional. Add schools, bootcamps, or certifications if they strengthen your resume.',
      ),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: /add education/i })).toBeTruthy();
    expect(screen.queryByText('No education added yet?')).toBeNull();
    expect(screen.queryByText("You're all set!")).toBeNull();
  });
});
