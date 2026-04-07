'use client';

import NextLink from 'next/link';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

import { AuthMarketingPanel } from '@/app/components/auth/auth-marketing-panel';
import { RegisterForm } from '@/app/components/auth/register';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AuthMarketingPanel />

      {/* Right Panel - Form */}
      <div className="bg-background flex w-full flex-col justify-center p-6 lg:w-[55%] lg:px-24 lg:py-12">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mx-auto w-full max-w-[440px] space-y-10"
        >
          {/* Mobile Logo - Centered */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-8 flex justify-center lg:hidden"
          >
            <NextLink
              href="/"
              className="text-foreground flex items-center gap-2.5 text-2xl font-bold transition-opacity hover:opacity-80"
            >
              <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
                <Icon icon="lucide:file-text" className="size-5" />
              </div>
              TailorCV
            </NextLink>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center lg:text-left"
          >
            <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
              Create account
            </h2>
            <p className="text-muted mt-3 text-lg">
              Start building your resume for free.
            </p>
          </motion.div>
          <RegisterForm />
        </motion.div>
      </div>
    </div>
  );
}
