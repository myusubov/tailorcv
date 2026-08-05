import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type {
  AnchorHTMLAttributes,
  FocusEventHandler,
  ReactElement,
  ReactNode,
} from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import type { RegisterFormValues } from '@/lib/schemas/auth';
import { RegisterTermsField } from './register-terms-field';

interface ChildrenProps {
  children?: ReactNode;
}

vi.mock('@heroui/react', () => ({
  Checkbox: Object.assign(
    ({
      children,
      isInvalid,
      isSelected,
      name,
      onBlur,
      onChange,
    }: ChildrenProps & {
      isInvalid?: boolean;
      isSelected?: boolean;
      name?: string;
      onBlur?: FocusEventHandler<HTMLInputElement>;
      onChange?: (isSelected: boolean) => void;
    }): ReactElement => (
      <label data-invalid={isInvalid ? 'true' : 'false'}>
        <input
          checked={isSelected}
          name={name}
          type="checkbox"
          onBlur={onBlur}
          onChange={(event) => onChange?.(event.currentTarget.checked)}
        />
        {children}
      </label>
    ),
    {
      Content: ({ children }: ChildrenProps): ReactElement => (
        <span>{children}</span>
      ),
      Control: ({ children }: ChildrenProps): ReactElement => (
        <span>{children}</span>
      ),
      Indicator: (): ReactElement => <span />,
    },
  ),
  Link: ({ children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props}>{children}</a>
  ),
}));

/**
 * Renders the controlled terms field and exposes its current boolean value.
 */
function RegisterTermsFieldHarness(): ReactElement {
  const { control } = useForm<RegisterFormValues>({
    defaultValues: {
      confirmPassword: '',
      email: '',
      password: '',
      terms: false,
    },
  });
  const terms = useWatch({ control, name: 'terms' });

  return (
    <>
      <RegisterTermsField control={control} />
      <output data-testid="terms-value">{String(terms)}</output>
    </>
  );
}

describe('RegisterTermsField', () => {
  it('toggles the terms value through its accessible label', async () => {
    const user = userEvent.setup();
    render(<RegisterTermsFieldHarness />);

    const checkbox = screen.getByRole('checkbox', {
      name: 'I agree to the Terms and Privacy Policy',
    });

    await user.click(checkbox);

    expect(screen.getByTestId('terms-value')).toHaveTextContent('true');
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute(
      'href',
      '#',
    );
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute(
      'href',
      '#',
    );
  });
});
