import { render, screen } from '@testing-library/react';
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactElement,
  TextareaHTMLAttributes,
} from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import type { OnboardingFormInput } from '@/lib/schemas/onboarding';
import { SummaryStep } from './summary-step';

vi.mock('@heroui/react', () => ({
  Button: ({
    children,
    onPress,
    variant: _variant,
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: string;
    onPress?: () => void;
  }): ReactElement => (
    <button type="button" onClick={onPress} {...props}>
      {children}
    </button>
  ),
  Description: ({
    children,
    ...props
  }: HTMLAttributes<HTMLParagraphElement>): ReactElement => (
    <p {...props}>{children}</p>
  ),
  FieldError: ({
    children,
    ...props
  }: HTMLAttributes<HTMLParagraphElement>): ReactElement => (
    <p role="alert" {...props}>
      {children}
    </p>
  ),
  Label: ({
    children,
    ...props
  }: HTMLAttributes<HTMLLabelElement>): ReactElement => (
    <label {...props}>{children}</label>
  ),
  TextArea: (
    props: TextareaHTMLAttributes<HTMLTextAreaElement>,
  ): ReactElement => <textarea {...props} />,
  TextField: ({
    children,
    isInvalid: _isInvalid,
    ...props
  }: HTMLAttributes<HTMLDivElement> & { isInvalid?: boolean }): ReactElement => (
    <div {...props}>{children}</div>
  ),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      initial: _initial,
      animate: _animate,
      transition: _transition,
      ...props
    }: HTMLAttributes<HTMLDivElement> & {
      initial?: unknown;
      animate?: unknown;
      transition?: unknown;
    }): ReactElement => <div {...props}>{children}</div>,
    h2: ({
      children,
      initial: _initial,
      animate: _animate,
      transition: _transition,
      ...props
    }: HTMLAttributes<HTMLHeadingElement> & {
      initial?: unknown;
      animate?: unknown;
      transition?: unknown;
    }): ReactElement => <h2 {...props}>{children}</h2>,
    p: ({
      children,
      initial: _initial,
      animate: _animate,
      transition: _transition,
      ...props
    }: HTMLAttributes<HTMLParagraphElement> & {
      initial?: unknown;
      animate?: unknown;
      transition?: unknown;
    }): ReactElement => <p {...props}>{children}</p>,
  },
}));

vi.mock('@iconify/react', () => ({
  Icon: ({
    icon,
    ...props
  }: HTMLAttributes<HTMLSpanElement> & { icon: string }): ReactElement => (
    <span data-icon={icon} {...props} />
  ),
}));

function SummaryStepHarness(): ReactElement {
  const form = useForm<OnboardingFormInput>({
    defaultValues: {
      version: 1,
      contact: {
        firstName: '',
        lastName: '',
        headline: '',
        email: '',
        phone: '',
        location: '',
        websiteUrl: '',
        linkedinUrl: '',
        githubUrl: '',
      },
      summary: '',
      skills: [],
      experiences: [],
      projects: [],
      education: [],
      certifications: [],
      languages: [],
    },
  });

  return (
    <FormProvider {...form}>
      <SummaryStep onNext={() => undefined} onBack={() => undefined} />
    </FormProvider>
  );
}

describe('SummaryStep', () => {
  it('keeps the summary prompt focused without a separate help panel', () => {
    render(<SummaryStepHarness />);

    expect(
      screen.getByText(
        'Write 2-3 sentences about what you do, what you are strong at, and where you create impact.',
      ),
    ).toBeTruthy();
    expect(screen.getAllByText('Professional Summary').length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getByText(
        'Include role, seniority, technologies, and one measurable strength. You can leave this blank. TailorCV can generate a draft later.',
      ),
    ).toBeTruthy();
    expect(screen.queryByText('Need help?')).toBeNull();
  });
});
