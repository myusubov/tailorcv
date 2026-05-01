import { render, screen } from '@testing-library/react';
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactElement,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import type { OnboardingFormInput } from '@/lib/schemas/onboarding';
import { ProjectItemContent } from './project-item-content';

interface ChildrenProps {
  children?: ReactNode;
}

vi.mock('@heroui/react', () => ({
  Button: ({
    children,
    onPress,
    isIconOnly: _isIconOnly,
    variant: _variant,
    size: _size,
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement> & {
    isIconOnly?: boolean;
    onPress?: () => void;
    size?: string;
    variant?: string;
  }): ReactElement => (
    <button type="button" onClick={onPress} {...props}>
      {children}
    </button>
  ),
  Calendar: Object.assign(
    ({ children }: ChildrenProps): ReactElement => <div>{children}</div>,
    {
      Cell: ({ date }: { date: unknown }): ReactElement => (
        <button type="button">{String(date)}</button>
      ),
      Grid: ({ children }: ChildrenProps): ReactElement => <div>{children}</div>,
      GridBody: ({
        children,
      }: {
        children: (date: string) => ReactNode;
      }): ReactElement => <div>{children('2026-01-01')}</div>,
      GridHeader: ({
        children,
      }: {
        children: (day: string) => ReactNode;
      }): ReactElement => <div>{children('Mon')}</div>,
      Header: ({ children }: ChildrenProps): ReactElement => <div>{children}</div>,
      HeaderCell: ({ children }: ChildrenProps): ReactElement => (
        <span>{children}</span>
      ),
      NavButton: (props: ButtonHTMLAttributes<HTMLButtonElement>): ReactElement => (
        <button type="button" {...props} />
      ),
      YearPickerCell: ({ year }: { year: number }): ReactElement => (
        <button type="button">{year}</button>
      ),
      YearPickerGrid: ({ children }: ChildrenProps): ReactElement => (
        <div>{children}</div>
      ),
      YearPickerGridBody: ({
        children,
      }: {
        children: ({ year }: { year: number }) => ReactNode;
      }): ReactElement => <div>{children({ year: 2026 })}</div>,
      YearPickerTrigger: ({ children }: ChildrenProps): ReactElement => (
        <button type="button">{children}</button>
      ),
      YearPickerTriggerHeading: (): ReactElement => <span>2026</span>,
      YearPickerTriggerIndicator: (): ReactElement => <span />,
    },
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
      Header: ({
        children,
        ...props
      }: HTMLAttributes<HTMLDivElement>): ReactElement => (
        <div {...props}>{children}</div>
      ),
      Title: ({
        children,
        ...props
      }: HTMLAttributes<HTMLHeadingElement>): ReactElement => (
        <h3 {...props}>{children}</h3>
      ),
    },
  ),
  Checkbox: Object.assign(
    ({
      children,
      isSelected: _isSelected,
      onChange: _onChange,
    }: ChildrenProps & {
      isSelected?: boolean;
      onChange?: (isSelected: boolean) => void;
    }): ReactElement => <label>{children}</label>,
    {
      Content: ({ children }: ChildrenProps): ReactElement => <span>{children}</span>,
      Control: ({ children }: ChildrenProps): ReactElement => <span>{children}</span>,
      Indicator: (): ReactElement => <span />,
    },
  ),
  DateField: Object.assign(
    {},
    {
      Group: ({ children }: ChildrenProps): ReactElement => <div>{children}</div>,
      Input: ({
        children,
      }: {
        children: (segment: string) => ReactNode;
      }): ReactElement => <div>{children('month')}</div>,
      Segment: ({ segment }: { segment: string }): ReactElement => (
        <span>{segment}</span>
      ),
      Suffix: ({ children }: ChildrenProps): ReactElement => <div>{children}</div>,
    },
  ),
  DatePicker: Object.assign(
    ({
      children,
      isDisabled: _isDisabled,
      isInvalid: _isInvalid,
      isRequired: _isRequired,
      onChange: _onChange,
      value,
      ...props
    }: ChildrenProps &
      HTMLAttributes<HTMLDivElement> & {
        isDisabled?: boolean;
        isInvalid?: boolean;
        isRequired?: boolean;
        onChange?: (value: unknown) => void;
        value?: unknown;
      }): ReactElement => (
      <div
        data-date-picker-value={
          value && typeof value === 'object' ? String(value) : undefined
        }
        {...props}
      >
        {children}
      </div>
    ),
    {
      Popover: ({ children }: ChildrenProps): ReactElement => <div>{children}</div>,
      Trigger: ({ children }: ChildrenProps): ReactElement => (
        <button type="button">{children}</button>
      ),
      TriggerIndicator: (): ReactElement => <span />,
    },
  ),
  FieldError: ({ children }: ChildrenProps): ReactElement => <p>{children}</p>,
  Input: (props: InputHTMLAttributes<HTMLInputElement>): ReactElement => (
    <input {...props} />
  ),
  Label: ({
    children,
    isRequired,
    ...props
  }: HTMLAttributes<HTMLLabelElement> & { isRequired?: boolean }): ReactElement => (
    <label data-required={isRequired ? 'true' : 'false'} {...props}>
      {children}
    </label>
  ),
  TextArea: (
    props: TextareaHTMLAttributes<HTMLTextAreaElement>,
  ): ReactElement => <textarea {...props} />,
  TextField: ({
    children,
    isInvalid: _isInvalid,
    isRequired: _isRequired,
    ...props
  }: HTMLAttributes<HTMLDivElement> & {
    isInvalid?: boolean;
    isRequired?: boolean;
  }): ReactElement => (
    <div {...props}>{children}</div>
  ),
  Tooltip: Object.assign(
    ({ children }: ChildrenProps): ReactElement => <>{children}</>,
    {
      Content: ({ children }: ChildrenProps): ReactElement => <div>{children}</div>,
    },
  ),
}));

vi.mock('@iconify/react', () => ({
  Icon: ({
    icon,
    ...props
  }: HTMLAttributes<HTMLSpanElement> & { icon: string }): ReactElement => (
    <span data-icon={icon} {...props} />
  ),
}));

vi.mock('@/app/components/ui', () => ({
  ArrayInput: ({ label }: { label: string }): ReactElement => <div>{label}</div>,
}));

interface ProjectItemContentHarnessProps {
  endDate?: string;
  isCurrent?: boolean;
  startDate?: string;
}

function ProjectItemContentHarness({
  endDate = '',
  isCurrent = false,
  startDate = '',
}: ProjectItemContentHarnessProps = {}): ReactElement {
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
      projects: [
        {
          id: 'project-1',
          name: 'Personal Portfolio',
          role: '',
          startDate,
          endDate,
          isCurrent,
          url: '',
          repoUrl: '',
          tech: [],
          bullets: [{ id: 'bullet-1', text: '' }],
        },
      ],
      education: [],
      certifications: [],
      languages: [],
    },
  });

  return (
    <FormProvider {...form}>
      <ProjectItemContent
        index={0}
        onDelete={() => undefined}
        onDuplicate={() => undefined}
      />
    </FormProvider>
  );
}

describe('ProjectItemContent', () => {
  it('marks project dates as required only when date context needs them', () => {
    const { unmount } = render(<ProjectItemContentHarness />);

    expect(screen.getByText('Start Date').dataset.required).toBe('false');
    expect(screen.getByText('End Date').dataset.required).toBe('false');

    unmount();
    const endDateRender = render(
      <ProjectItemContentHarness endDate="2026-02" />,
    );

    expect(screen.getByText('Start Date').dataset.required).toBe('true');
    expect(screen.getByText('End Date').dataset.required).toBe('false');

    endDateRender.unmount();
    const startDateRender = render(
      <ProjectItemContentHarness startDate="2026-01" />,
    );

    expect(screen.getByText('Start Date').dataset.required).toBe('false');
    expect(screen.getByText('End Date').dataset.required).toBe('true');

    startDateRender.unmount();
    render(<ProjectItemContentHarness isCurrent />);

    expect(screen.getByText('Start Date').dataset.required).toBe('true');
    expect(screen.getByText('End Date').dataset.required).toBe('false');
  });

  it('passes full saved dates through to the date picker', () => {
    render(
      <ProjectItemContentHarness
        startDate="2026-04-20"
        endDate="2026-05-12"
      />,
    );

    expect(
      screen
        .getByText('Start Date')
        .closest('[data-date-picker-value]')
        ?.getAttribute('data-date-picker-value'),
    ).toBe('2026-04-20');
    expect(
      screen
        .getByText('End Date')
        .closest('[data-date-picker-value]')
        ?.getAttribute('data-date-picker-value'),
    ).toBe('2026-05-12');
  });

});
