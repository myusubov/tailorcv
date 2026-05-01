'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Button, Card } from '@heroui/react';
import { Icon } from '@iconify/react';
import type { ReactNode } from 'react';

interface OnboardingItemSectionProps {
  /** Button label used while the list is empty. */
  addLabel: string;
  /** Button label used after at least one item exists. */
  addMoreLabel: string;
  /** Populated item count. */
  count: number;
  /** Empty-state helper copy. */
  emptyDescription: string;
  /** Rendered list items. */
  children: ReactNode;
  /** Callback used by both add buttons. */
  onAdd: () => void;
  /** Singular item label used in the populated count. */
  singularLabel: string;
  /** Section title. */
  title: string;
}

/**
 * Renders a repeatable onboarding section with a count, empty state,
 * animated item list, and consistent add action.
 */
export function OnboardingItemSection({
  addLabel,
  addMoreLabel,
  count,
  emptyDescription,
  children,
  onAdd,
  singularLabel,
  title,
}: OnboardingItemSectionProps) {
  const countLabel = `${count} ${count === 1 ? singularLabel : `${singularLabel}s`}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-foreground text-lg font-semibold">{title}</h3>
        {count > 0 && (
          <span className="text-muted-foreground text-sm font-medium">
            {countLabel}
          </span>
        )}
      </div>

      {count === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="mt-2">
            <Card.Content className="flex flex-col items-center justify-center px-5 py-5 text-center">
              <p className="text-muted-foreground text-sm text-balance">
                {emptyDescription}
              </p>

              <div className="mt-4 w-full max-w-sm">
                <Button variant="secondary" onPress={onAdd} className="w-full">
                  <Icon icon="lucide:plus" className="size-4" />
                  {addLabel}
                </Button>
              </div>
            </Card.Content>
          </Card>
        </motion.div>
      ) : (
        <>
          <AnimatePresence mode="popLayout">{children}</AnimatePresence>
          <Button variant="secondary" onPress={onAdd} className="w-full">
            <Icon icon="lucide:plus" className="size-4" />
            {addMoreLabel}
          </Button>
        </>
      )}
    </motion.div>
  );
}
