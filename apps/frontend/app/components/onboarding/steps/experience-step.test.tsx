import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExperienceStep } from './experience-step';
import { FormProvider, useForm } from 'react-hook-form';

// Mock dependencies
vi.mock('@heroui/react', async () => {
  const actual = await vi.importActual('@heroui/react');
  return {
    ...actual,
    useOverlayState: () => ({
      isOpen: false,
      open: vi.fn(),
      close: vi.fn(),
      setOpen: vi.fn(),
      toggle: vi.fn(),
    }),
  };
});

// Mock sub-components to focus on ExperienceStep logic
vi.mock('../step-header', () => ({
  StepHeader: ({ title }: { title: string }) => (
    <div data-testid="step-header">{title}</div>
  ),
}));

vi.mock('./experience-item-content', () => ({
  ExperienceItemContent: ({ index }: { index: number }) => (
    <div data-testid={`experience-item-${index}`}>
      Experience Item {index + 1}
    </div>
  ),
}));

vi.mock('@/app/components/experience/delete-experience-modal', () => ({
  DeleteExperienceModal: () => <div data-testid="delete-modal" />,
}));

vi.mock('@/app/components/ui/reorderable-item', () => ({
  ReorderableItem: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// Wrapper to provide React Hook Form context
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const methods = useForm({
    defaultValues: {
      experiences: [],
    },
  });

  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('ExperienceStep', () => {
  const mockOnNext = vi.fn();
  const mockOnBack = vi.fn();

  it('renders empty state initially', () => {
    render(
      <TestWrapper>
        <ExperienceStep onNext={mockOnNext} onBack={mockOnBack} />
      </TestWrapper>,
    );

    expect(screen.getByTestId('step-header')).toHaveTextContent(
      'Work Experience',
    );
    expect(screen.getByText('No work experience yet?')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /add your first job/i }),
    ).toBeInTheDocument();
  });

  it('navigates back when Back button is clicked', () => {
    render(
      <TestWrapper>
        <ExperienceStep onNext={mockOnNext} onBack={mockOnBack} />
      </TestWrapper>,
    );

    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('calls onNext when Skip/Next button is clicked', () => {
    render(
      <TestWrapper>
        <ExperienceStep onNext={mockOnNext} onBack={mockOnBack} />
      </TestWrapper>,
    );

    const nextButton = screen.getByRole('button', { name: /skip/i });
    fireEvent.click(nextButton);
    expect(mockOnNext).toHaveBeenCalledTimes(1);
  });

  it('adds a new experience when "Add your first job" is clicked', async () => {
    render(
      <TestWrapper>
        <ExperienceStep onNext={mockOnNext} onBack={mockOnBack} />
      </TestWrapper>,
    );

    const addButton = screen.getByRole('button', {
      name: /add your first job/i,
    });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId('experience-item-0')).toBeInTheDocument();
    });

    expect(
      screen.queryByText('No work experience yet?'),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toHaveTextContent(
      'Next: Projects & Skills',
    );
  });

  it('adds another experience when "Add Another Job" is clicked', async () => {
    // Render efficiently properly populated form if needed, or interact
    const { getByRole, getByTestId, rerender } = render(
      <TestWrapper>
        <ExperienceStep onNext={mockOnNext} onBack={mockOnBack} />
      </TestWrapper>,
    );

    // Add first
    fireEvent.click(getByRole('button', { name: /add your first job/i }));
    await waitFor(() =>
      expect(getByTestId('experience-item-0')).toBeInTheDocument(),
    );

    // Add second
    const addAnotherBtn = getByRole('button', { name: /add another job/i });
    fireEvent.click(addAnotherBtn);

    await waitFor(() => {
      expect(getByTestId('experience-item-1')).toBeInTheDocument();
    });
  });
});
