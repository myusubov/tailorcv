import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactElement,
} from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import type { OnboardingFormInput } from '@/lib/schemas/onboarding';
import { ProjectsStep } from './projects-step';

interface RenderProjectsStepArgs {
  skills?: OnboardingFormInput['skills'];
  projects?: OnboardingFormInput['projects'];
}

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
  Card: Object.assign(
    ({ children, ...props }: HTMLAttributes<HTMLElement>): ReactElement => (
      <section {...props}>{children}</section>
    ),
    {
      Content: ({
        children,
        ...props
      }: HTMLAttributes<HTMLDivElement>): ReactElement => (
        <div {...props}>{children}</div>
      ),
    },
  ),
  Chip: ({
    children,
    ...props
  }: HTMLAttributes<HTMLSpanElement>): ReactElement => (
    <span {...props}>{children}</span>
  ),
  Description: ({
    children,
    ...props
  }: HTMLAttributes<HTMLParagraphElement>): ReactElement => (
    <p {...props}>{children}</p>
  ),
  Input: (props: InputHTMLAttributes<HTMLInputElement>): ReactElement => (
    <input {...props} />
  ),
  Label: ({
    children,
    ...props
  }: HTMLAttributes<HTMLLabelElement>): ReactElement => (
    <label {...props}>{children}</label>
  ),
  TextField: ({
    children,
    ...props
  }: HTMLAttributes<HTMLDivElement>): ReactElement => (
    <div {...props}>{children}</div>
  ),
  useOverlayState: (): {
    isOpen: boolean;
    open: () => void;
    setOpen: () => void;
  } => ({
    isOpen: false,
    open: vi.fn(),
    setOpen: vi.fn(),
  }),
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({
    children,
  }: {
    children: ReactElement | ReactElement[];
  }): ReactElement => <>{children}</>,
  motion: {
    div: ({
      children,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      layout: _layout,
      ...props
    }: HTMLAttributes<HTMLDivElement> & {
      initial?: unknown;
      animate?: unknown;
      exit?: unknown;
      transition?: unknown;
      layout?: unknown;
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

vi.mock('@/app/components/projects/delete-project-modal', () => ({
  DeleteProjectModal: (): null => null,
}));

vi.mock('@/app/components/ui/reorderable-item', () => ({
  ReorderableItem: ({ children }: { children: ReactElement }): ReactElement => (
    <div>{children}</div>
  ),
}));

vi.mock('./project-item-content', () => ({
  ProjectItemContent: ({ index }: { index: number }): ReactElement => (
    <div aria-label={`Project ${index + 1}`}>{index + 1}</div>
  ),
}));

function ProjectsStepHarness({
  skills = [],
  projects = [],
}: RenderProjectsStepArgs): ReactElement {
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
      skills,
      experiences: [],
      projects,
      education: [],
      certifications: [],
      languages: [],
    },
  });

  return (
    <FormProvider {...form}>
      <ProjectsStep onNext={() => undefined} onBack={() => undefined} />
    </FormProvider>
  );
}

function renderProjectsStep(args: RenderProjectsStepArgs = {}): void {
  render(<ProjectsStepHarness {...args} />);
}

describe('ProjectsStep', () => {
  it('removes a skill chip immediately when its remove button is clicked', async () => {
    const user = userEvent.setup();

    renderProjectsStep({
      skills: [
        { id: 'skill-react', name: 'React', category: null, level: null },
        {
          id: 'skill-typescript',
          name: 'TypeScript',
          category: null,
          level: null,
        },
      ],
    });

    await user.click(
      screen.getByRole('button', { name: 'Remove TypeScript skill' }),
    );

    expect(screen.queryByText('TypeScript')).toBeNull();
    expect(screen.getByText('React')).toBeTruthy();
  });

  it('clears all skill chips when the clear all skills button is clicked', async () => {
    const user = userEvent.setup();

    renderProjectsStep({
      skills: [
        { id: 'skill-react', name: 'React', category: null, level: null },
        {
          id: 'skill-typescript',
          name: 'TypeScript',
          category: null,
          level: null,
        },
      ],
    });

    await user.click(screen.getByRole('button', { name: 'Clear all skills' }));

    expect(screen.queryByText('React')).toBeNull();
    expect(screen.queryByText('TypeScript')).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Clear all skills' }),
    ).toBeNull();
  });
});
