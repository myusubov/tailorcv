import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { registerSchema } from './auth';

const validRegisterInput = {
  email: 'new-user@example.com',
  password: 'Password123!',
  confirmPassword: 'Password123!',
  terms: true,
};

describe('registerSchema', () => {
  it('accepts matching password confirmation', () => {
    const result = registerSchema.safeParse(validRegisterInput);

    expect(result.success).toBe(true);
  });

  it('rejects mismatched password confirmation on the confirmPassword field', () => {
    const result = registerSchema.safeParse({
      ...validRegisterInput,
      confirmPassword: 'Different123!',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const tree = z.treeifyError(result.error);

      expect(tree.properties?.confirmPassword?.errors).toContain(
        'Passwords do not match',
      );
    }
  });
});
