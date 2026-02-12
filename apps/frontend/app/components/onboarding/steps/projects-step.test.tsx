import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProjectsStep } from './projects-step';
import { FormProvider, useForm } from 'react-hook-form';

// Mock sub-components
vi.mock('../step-header', () => ({
    StepHeader: ({ title }: { title: string }) => <div data-testid="step-header">{title}</div>
}));

vi.mock('./project-item-content', () => ({
    ProjectItemContent: ({ index }: { index: number }) => (
        <div data-testid={`project-item-${index}`}>Project Item {index + 1}</div>
    )
}));

vi.mock('@/app/components/projects/delete-project-modal', () => ({
    DeleteProjectModal: () => <div data-testid="delete-project-modal" />
}));

vi.mock('@/app/components/ui/reorderable-item', () => ({
    ReorderableItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock HeroUI components used for Skills input
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
        // Simplified mocks for complex UI components if needed, but often JSDOM handles them ok
        // If we encounter issues with TextField/Input not triggering events, we might strictly mock them
    };
});


// Wrapper to provide React Hook Form context
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
    const methods = useForm({
        defaultValues: {
            projects: [],
            skills: []
        }
    });

    return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('ProjectsStep', () => {
    const mockOnNext = vi.fn();
    const mockOnBack = vi.fn();

    it('renders correctly', () => {
        render(
            <TestWrapper>
                <ProjectsStep onNext={mockOnNext} onBack={mockOnBack} />
            </TestWrapper>
        );

        expect(screen.getByTestId('step-header')).toHaveTextContent('Projects & Skills');
        expect(screen.getByText('Projects')).toBeInTheDocument();
        expect(screen.getByText('Technical Skills')).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/type a skill and press enter/i)).toBeInTheDocument();
    });

    it('adds a new project when Add Project button is clicked', async () => {
        render(
            <TestWrapper>
                <ProjectsStep onNext={mockOnNext} onBack={mockOnBack} />
            </TestWrapper>
        );

        const addBtn = screen.getByRole('button', { name: /add project/i });
        fireEvent.click(addBtn);

        await waitFor(() => {
            expect(screen.getByTestId('project-item-0')).toBeInTheDocument();
        });
    });

    it('adds a skill when user types and presses Enter', async () => {
        render(
            <TestWrapper>
                <ProjectsStep onNext={mockOnNext} onBack={mockOnBack} />
            </TestWrapper>
        );

        const input = screen.getByPlaceholderText(/type a skill and press enter/i);
        fireEvent.change(input, { target: { value: 'React' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        await waitFor(() => {
            expect(screen.getByText('React')).toBeInTheDocument();
        });

        // Verify input clears
        expect(input).toHaveValue('');
    });

    it('removes a skill when delete button is clicked', async () => {
        render(
            <TestWrapper>
                <ProjectsStep onNext={mockOnNext} onBack={mockOnBack} />
            </TestWrapper>
        );

        // Add skill first
        const input = screen.getByPlaceholderText(/type a skill and press enter/i);
        fireEvent.change(input, { target: { value: 'TypeScript' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

        await waitFor(() => expect(screen.getByText('TypeScript')).toBeInTheDocument());

        // Find the delete button inside the chip (it won't have text, but it's the only button descending from the chip area besides add project/nav)
        // Since we mock Icon, let's find the button wrapping it.
        // Actually, we can just look for the button that is likely near "TypeScript"
        // But simpler: we know there's a button with class containing 'rounded-full' or just 'button' type
        // Let's rely on the fact that we just added it.
        // We can query selector `button:has(svg)` or similar if supported, or traverse.
        
        // Let's use getByRole('button') combined with the fact it's inside the skills area
        // Or better, let's just click the button that *contains* the X icon if we can identify it.
        // Since we didn't strictly mock Icon to have a testId, let's update Icon mock to help us.
        
        // Actually, simpler approach: The button itself is clickable.
        // Let's just find the button that is NOT "Back", "Next", "Add Project".
        // The skill delete button has no text.
        
        const buttons = screen.getAllByRole('button');
        const deleteButton = buttons.find(b => !b.textContent && !b.getAttribute('aria-label')); // Heuristic: it has no text content
        // Or filtering by class if we rendered real DOM (but classes might be obfuscated)
        
        // Let's try to click the one that looks like a delete button
        if (deleteButton) {
            fireEvent.click(deleteButton);
            await waitFor(() => {
                expect(screen.queryByText('TypeScript')).not.toBeInTheDocument();
            });
        } else {
             // Fallback if we can't find it - fail test
             expect(true).toBe(false); // Force failure to debug
        }
    });

    it('navigates correctly', () => {
        render(
            <TestWrapper>
                <ProjectsStep onNext={mockOnNext} onBack={mockOnBack} />
            </TestWrapper>
        );

        fireEvent.click(screen.getByRole('button', { name: /next/i }));
        expect(mockOnNext).toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: /back/i }));
        expect(mockOnBack).toHaveBeenCalled();
    });
});
