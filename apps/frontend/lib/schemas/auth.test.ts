import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth';

describe('Auth Schemas', () => {
  describe('registerSchema', () => {
    it('should accept valid registration data', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        terms: true,
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = registerSchema.safeParse({
        email: 'invalid-email',
        password: 'password123',
        terms: true,
      });
      expect(result.success).toBe(false);
    });

    it('should reject password shorter than 8 characters', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: '1234567',
        terms: true,
      });
      expect(result.success).toBe(false);
    });

    it('should reject when terms are not accepted', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        terms: false,
      });
      expect(result.success).toBe(false);
    });

    it('should allow optional firstName and lastName', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        terms: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('loginSchema', () => {
    it('should accept valid login credentials', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'anypassword',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'not-an-email',
        password: 'password',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('forgotPasswordSchema', () => {
    it('should accept valid email', () => {
      const result = forgotPasswordSchema.safeParse({
        email: 'test@example.com',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = forgotPasswordSchema.safeParse({
        email: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('resetPasswordSchema', () => {
    it('should accept matching passwords', () => {
      const result = resetPasswordSchema.safeParse({
        password: 'newPassword123',
        confirmPassword: 'newPassword123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject mismatched passwords', () => {
      const result = resetPasswordSchema.safeParse({
        password: 'password123',
        confirmPassword: 'differentPassword',
      });
      expect(result.success).toBe(false);
    });

    it('should reject password shorter than 8 characters', () => {
      const result = resetPasswordSchema.safeParse({
        password: 'short',
        confirmPassword: 'short',
      });
      expect(result.success).toBe(false);
    });
  });
});
