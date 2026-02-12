import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EducationStep } from './education-step';
import { FormProvider, useForm } from 'react-hook-form';

// Mock sub-components
vi.mock('../step-header', () => ({
    StepHeader: ({ title }: { title: string }) => <div data-testid="step-header">{title}</div>
}));

vi.mock('./education-item-content', () => ({
    EducationItemContent: ({ index, onDelete }: { index: number; onDelete: () => void }) => (
        <div data-testid={`education-item-${index}`}>
            Education Item {index + 1}
            <button onClick={onDelete} aria-label={`Delete item ${index}`}>Delete</button>
        </div>
    )
}));

vi.mock('@/app/components/ui/reorderable-item', () => ({
    ReorderableItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Wrapper to provide React Hook Form context
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
    const methods = useForm({
        defaultValues: {
            education: []
        }
    });

    return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('EducationStep', () => {
    const mockOnFinish = vi.fn();
    const mockOnBack = vi.fn();

    it('renders empty state initially', () => {
        render(
            <TestWrapper>
                <EducationStep onFinish={mockOnFinish} onBack={mockOnBack} />
            </TestWrapper>
        );

        expect(screen.getByTestId('step-header')).toHaveTextContent('Education');
        expect(screen.getByText('No education added yet?')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /add education/i })).toBeInTheDocument();
    });

    it('navigates back when Back button is clicked', () => {
        render(
            <TestWrapper>
                <EducationStep onFinish={mockOnFinish} onBack={mockOnBack} />
            </TestWrapper>
        );

        fireEvent.click(screen.getByRole('button', { name: /back/i }));
        expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('calls onFinish when Generate Resume button is clicked', () => {
        render(
            <TestWrapper>
                <EducationStep onFinish={mockOnFinish} onBack={mockOnBack} />
            </TestWrapper>
        );

        const generateBtn = screen.getByRole('button', { name: /generate resume!/i });
        fireEvent.click(generateBtn);
        expect(mockOnFinish).toHaveBeenCalledTimes(1);
    });

    it('adds new education item when "Add Education" is clicked', async () => {
        render(
            <TestWrapper>
                <EducationStep onFinish={mockOnFinish} onBack={mockOnBack} />
            </TestWrapper>
        );

        const addBtn = screen.getByRole('button', { name: /add education/i });
        fireEvent.click(addBtn);

        await waitFor(() => {
            expect(screen.getByTestId('education-item-0')).toBeInTheDocument();
        });

        expect(screen.queryByText('No education added yet?')).not.toBeInTheDocument();
    });

    it('deletes education item when delete button is clicked', async () => {
        // We'll use a slightly different wrapper to prepopulate data if needed, or just add then delete
        const { getByRole, getByTestId, queryByTestId } = render(
            <TestWrapper>
                <EducationStep onFinish={mockOnFinish} onBack={mockOnBack} />
            </TestWrapper>
        );

        // Add
        fireEvent.click(getByRole('button', { name: /add education/i }));
        await waitFor(() => expect(getByTestId('education-item-0')).toBeInTheDocument());

        // Delete
        const deleteBtn = getByRole('button', { name: /delete item 0/i });
        fireEvent.click(deleteBtn);

        await waitFor(() => {
            expect(queryByTestId('education-item-0')).not.toBeInTheDocument();
        });
    });

    it('shows loading state when isLoading is true', () => {
        render(
            <TestWrapper>
                <EducationStep onFinish={mockOnFinish} onBack={mockOnBack} isLoading={true} />
            </TestWrapper>
        );

        expect(screen.getByRole('button', { name: /generating.../i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /back/i })).toBeDisabled();
    });
});
