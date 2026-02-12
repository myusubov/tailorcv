import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SummaryStep } from './summary-step';
import { FormProvider, useForm } from 'react-hook-form';

// Mock StepHeader
vi.mock('../step-header', () => ({
    StepHeader: ({ title }: { title: string }) => <div data-testid="step-header">{title}</div>
}));

// Wrapper to provide React Hook Form context
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
    const methods = useForm({
        defaultValues: {
            summary: ''
        }
    });

    return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('SummaryStep', () => {
    const mockOnNext = vi.fn();
    const mockOnBack = vi.fn();

    it('renders correctly', () => {
        render(
            <TestWrapper>
                <SummaryStep onNext={mockOnNext} onBack={mockOnBack} />
            </TestWrapper>
        );

        expect(screen.getByTestId('step-header')).toHaveTextContent('Professional Summary');
        // Summary uses TextArea which might not be labelled with standard label but usually "Your Summary"
        expect(screen.getByLabelText(/your summary/i)).toBeInTheDocument();
    });

    it('updates form values when typed', async () => {
        const { getByLabelText } = render(
            <TestWrapper>
                <SummaryStep onNext={mockOnNext} onBack={mockOnBack} />
            </TestWrapper>
        );

        const summaryInput = getByLabelText(/your summary/i);
        fireEvent.change(summaryInput, { target: { value: 'Experienced developer.' } });
        expect(summaryInput).toHaveValue('Experienced developer.');
    });

    it('navigates correctly', () => {
        render(
            <TestWrapper>
                <SummaryStep onNext={mockOnNext} onBack={mockOnBack} />
            </TestWrapper>
        );

        fireEvent.click(screen.getByRole('button', { name: /next/i }));
        expect(mockOnNext).toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: /back/i }));
        expect(mockOnBack).toHaveBeenCalled();
    });
});
