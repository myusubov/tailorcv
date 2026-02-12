import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ContactStep } from './contact-step';
import { FormProvider, useForm } from 'react-hook-form';

// Mock StepHeader
vi.mock('../step-header', () => ({
    StepHeader: ({ title }: { title: string }) => <div data-testid="step-header">{title}</div>
}));

// Wrapper to provide React Hook Form context
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
    const methods = useForm({
        defaultValues: {
            contact: {
                firstName: '',
                lastName: '',
                email: '',
                phone: null,
                location: null,
                githubUrl: null,
                linkedinUrl: null,
                websiteUrl: null
            }
        }
    });

    return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('ContactStep', () => {
    const mockOnNext = vi.fn();
    const mockOnBack = vi.fn();

    it('renders correctly', () => {
        render(
            <TestWrapper>
                <ContactStep onNext={mockOnNext} onBack={mockOnBack} />
            </TestWrapper>
        );

        expect(screen.getByTestId('step-header')).toHaveTextContent('Contact Information');
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    it('updates form values when typed', async () => {
        const { getByLabelText } = render(
            <TestWrapper>
                <ContactStep onNext={mockOnNext} onBack={mockOnBack} />
            </TestWrapper>
        );

        const firstNameInput = getByLabelText(/first name/i);
        fireEvent.change(firstNameInput, { target: { value: 'John' } });
        expect(firstNameInput).toHaveValue('John');

        const emailInput = getByLabelText(/email address/i);
        fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
        expect(emailInput).toHaveValue('john@example.com');
    });

    it('navigates correctly', () => {
        render(
            <TestWrapper>
                <ContactStep onNext={mockOnNext} onBack={mockOnBack} />
            </TestWrapper>
        );

        fireEvent.click(screen.getByRole('button', { name: /next/i }));
        expect(mockOnNext).toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: /back/i }));
        expect(mockOnBack).toHaveBeenCalled();
    });
});
