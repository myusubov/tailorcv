'use client';

import { AuthBrandPanel } from '@/app/components/auth/auth-brand-panel';
import { AuthLogo } from '@/app/components/auth/auth-logo';
import { RegisterForm } from '@/app/components/auth/register';
import { RegisterBrandPanelContent } from '@/app/components/auth/register/register-brand-panel-content';

/**
 * Renders the responsive registration route with shared TailorCV branding and
 * the custom Clerk-backed registration form.
 *
 * @returns The registration marketing and form layout.
 */
export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AuthBrandPanel>
        <RegisterBrandPanelContent />
      </AuthBrandPanel>

      {/* Right Panel - Form */}
      <div className="auth-register-form auth-form-panel">
        <div className="auth-form-content">
          {/* Mobile Logo - Centered */}
          <div className="auth-form-mobile-logo">
            <AuthLogo />
          </div>

          <div className="auth-form-mobile-intro lg:hidden">
            <h1 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
              Create account
            </h1>
            <p className="text-muted mt-3 text-lg">
              Start building your resume for free.
            </p>
          </div>
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
