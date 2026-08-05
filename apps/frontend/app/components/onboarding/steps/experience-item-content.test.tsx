import { fireEvent, render, screen } from '@testing-library/react';
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactElement,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react';
import { FormProvider, useForm, useFormContext, useWatch } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import type { OnboardingFormInput } from '@/lib/schemas/onboarding';
import { ExperienceItemContent } from './experience-item-content';

interface ChildrenProps {
  children?: ReactNode;
}

vi.mock('@heroui/react', () => ({
  Button: ({
    children,
    onPress,
    isDisabled,
    isIconOnly: _isIconOnly,
    variant: _variant,
    size: _size,
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement> & {
    isDisabled?: boolean;
    isIconOnly?: boolean;
    onPress?: () => void;
    size?: string;
    variant?: string;
  }): ReactElement => (
    <button type="button" disabled={isDisabled} onClick={onPress} {...props}>
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
      isSelected,
      onChange,
    }: ChildrenProps & {
      isSelected?: boolean;
      onChange?: (isSelected: boolean) => void;
    }): ReactElement => (
      <label>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(event) => onChange?.(event.currentTarget.checked)}
        />
        {children}
      </label>
    ),
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
  Description: ({ children }: ChildrenProps): ReactElement => <p>{children}</p>,
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

interface ExperienceItemContentHarnessProps {
  endDate?: string | null;
}

function ExperienceEndDateValue(): ReactElement {
  const { control } = useFormContext<OnboardingFormInput>();
  const endDate = useWatch({ control, name: 'experiences.0.endDate' });

  return (
    <output data-testid="experience-end-date-value">{String(endDate)}</output>
  );
}

function ExperienceItemContentHarness({
  endDate = '',
}: ExperienceItemContentHarnessProps = {}): ReactElement {
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
      experiences: [
        {
          id: 'experience-1',
          title: 'Frontend Developer',
          company: 'Acme Inc.',
          location: '',
          startDate: '2024-01',
          endDate,
          isCurrent: false,
          tech: [],
          bullets: [{ id: 'bullet-1', text: '' }],
        },
      ],
      projects: [],
      education: [],
      certifications: [],
      languages: [],
    },
  });

  return (
    <FormProvider {...form}>
      <ExperienceItemContent
        index={0}
        isFirst
        isLast
        onMoveDown={() => undefined}
        onMoveUp={() => undefined}
        onDelete={() => undefined}
        onDuplicate={() => undefined}
      />
      <ExperienceEndDateValue />
    </FormProvider>
  );
}

describe('ExperienceItemContent', () => {
  it('clears the end date when the experience becomes current', () => {
    render(<ExperienceItemContentHarness endDate="2026-05" />);

    fireEvent.click(
      screen.getByRole('checkbox', { name: 'I currently work here' }),
    );

    expect(screen.getByTestId('experience-end-date-value').textContent).toBe(
      'null',
    );
  });

  it('clears end date to null from the clear button', () => {
    render(<ExperienceItemContentHarness endDate="2026-05" />);

    expect(screen.getByTestId('experience-end-date-value').textContent).toBe(
      '2026-05',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Clear end date' }));

    expect(screen.getByTestId('experience-end-date-value').textContent).toBe(
      'null',
    );
  });
});
