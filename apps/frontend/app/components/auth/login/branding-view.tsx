import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

import { AuthLogo } from '../auth-logo';

/**
 * Renders the desktop login brand panel with a dark-background logo treatment.
 *
 * @returns The animated, desktop-only login marketing panel.
 */
export function LoginBranding() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative hidden w-full flex-col justify-between overflow-hidden bg-[#020617] p-12 text-white lg:flex lg:w-[45%] xl:p-16"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(79,70,229,0.15),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.15),transparent)]" />
      <div className="absolute -top-20 -left-20 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[100px]" />
      <div className="absolute -right-20 -bottom-20 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[100px]" />

      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <AuthLogo />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-24 max-w-lg"
        >
          <h1 className="text-5xl leading-tight font-bold tracking-tight lg:text-6xl">
            Welcome back to <br />
            <span className="bg-linear-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              TailorCV
            </span>
          </h1>
          <p className="mt-8 text-xl leading-relaxed text-slate-300">
            Please enter your details to sign in.
          </p>
        </motion.div>
      </div>

      <div className="relative z-10 mt-12 space-y-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="group flex items-center gap-4"
        >
          <div className="flex size-8 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30 transition-colors group-hover:bg-indigo-500/30 group-hover:text-indigo-200">
            <Icon icon="lucide:check" className="size-4" />
          </div>
          <span className="text-lg font-medium text-slate-200">
            Continue where you left off
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}
