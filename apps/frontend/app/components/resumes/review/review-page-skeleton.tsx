'use client';

import { motion } from 'framer-motion';
import { Skeleton } from '@heroui/react';

/** Number of accordion sections to show in the skeleton (matches ReviewAccordion). */
const ACCORDION_ITEMS = 6;

/** Number of analysis panel rows (Contact, Summary, Skills, Experience, Projects, Education). */
const ANALYSIS_ROWS = 6;

/** Animation variants for staggered entrance. */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
};

/**
 * Skeleton loading state for the resume review page.
 * Mirrors the layout of ReviewPageContent: left panel (header + DataAnalysisPanel + accordion)
 * and right panel (resume preview) for a smooth transition when data loads.
 * Includes staggered animations for a polished loading experience.
 */
export function ReviewPageSkeleton() {
  return (
    <motion.div
      className="relative mx-auto flex w-full max-w-7xl flex-col xl:flex-row"
      aria-busy="true"
      aria-label="Loading resume"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Left Panel - Editor skeleton */}
      <div className="border-default-200 w-full min-w-0 shrink-0 border-b p-4 md:p-6 xl:h-screen xl:w-1/2 xl:overflow-y-auto xl:border-r xl:border-b-0">
        {/* Header skeleton */}
        <motion.div className="mb-6" variants={itemVariants}>
          <div className="mb-2 flex items-center justify-between gap-4">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-4 w-24 rounded" />
          </div>
          <Skeleton className="h-4 w-72 max-w-full rounded" />
        </motion.div>

        {/* Data Analysis Panel skeleton */}
        <motion.div
          className="border-default-200 mb-6 rounded-xl border bg-default-50 p-4 shadow"
          variants={itemVariants}
        >
          <div className="mb-3 flex items-center justify-between">
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>
          <Skeleton className="mb-4 h-1.5 w-full rounded-full" />
          <div className="space-y-2">
            {Array.from({ length: ANALYSIS_ROWS }).map((_, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-3 rounded-lg px-3 py-2"
                variants={itemVariants}
              >
                <Skeleton className="size-4 shrink-0 rounded-full" />
                <Skeleton
                  className={`h-4 flex-1 rounded ${i % 3 === 0 ? 'max-w-[60%]' : i % 3 === 1 ? 'max-w-[75%]' : 'max-w-[50%]'}`}
                />
                <Skeleton className="h-3 w-16 shrink-0 rounded" />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Accordion skeleton - matches ReviewAccordion structure */}
        <motion.div
          className="accordion accordion--surface w-full shadow"
          variants={itemVariants}
        >
          {Array.from({ length: ACCORDION_ITEMS }).map((_, i) => (
            <motion.div
              key={i}
              className="border-default-200 border-b first:rounded-t-xl last:rounded-b-xl last:border-b-0"
              variants={itemVariants}
            >
              <div className="accordion__trigger flex w-full items-center justify-between gap-3 px-4 py-3">
                {/* Icon + label grouped at start (aligned towards start) */}
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Skeleton className="size-5 shrink-0 rounded" />
                  {/* Label skeleton: dynamic width (40% or 50% of row) so it scales */}
                  <Skeleton
                    className={`h-4 min-w-16 rounded ${i % 2 === 0 ? 'w-2/5' : 'w-1/2'}`}
                  />
                </div>
                {/* Indicator skeleton (chevron) at end */}
                <Skeleton className="size-4 shrink-0 rounded" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Right Panel - Resume preview skeleton (A4-ish aspect) */}
      <motion.div
        className="w-full min-w-0 shrink-0 overflow-x-hidden overflow-y-auto p-4 md:p-6 xl:sticky xl:top-0 xl:h-screen xl:w-1/2"
        variants={itemVariants}
      >
        <div className="mx-auto flex w-full max-w-full justify-center xl:max-w-none">
          <div className="relative w-full max-w-[794px] shrink-0 origin-top-left shadow-2xl">
            {/* Document-shaped skeleton: A4 proportion so it matches preview */}
            <Skeleton className="aspect-794/1123 w-full max-w-[794px] rounded-lg" />
            {/* Subtle content lines for a more realistic document feel */}
            <div
              className="absolute inset-4 flex flex-col gap-2 opacity-20"
              aria-hidden
            >
              <Skeleton className="h-6 w-1/3 rounded" />
              <Skeleton className="h-3 w-2/3 rounded" />
              <div className="mt-4 space-y-1.5">
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-5/6 rounded" />
                <Skeleton className="h-3 w-4/5 rounded" />
              </div>
              <div className="mt-6 space-y-1.5">
                <Skeleton className="h-4 w-1/4 rounded" />
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-3/4 rounded" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
