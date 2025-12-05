'use client';

import { useState } from 'react';
import { flushSync } from 'react-dom';

export default function ScopedTransitionsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 p-8 dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-4 text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          Scoped View Transitions Demo
        </h1>
        <p className="mb-8 text-lg text-zinc-600 dark:text-zinc-400">
          Testing the new scoped view transitions API available in Chrome 140+
        </p>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Document-scoped transition */}
          <TransitionDemo type="document" />

          {/* Element-scoped transition */}
          <TransitionDemo type="scoped" />
        </div>

        <div className="mt-12 rounded-lg bg-blue-50 p-6 dark:bg-blue-950">
          <h2 className="mb-2 text-xl font-semibold text-blue-900 dark:text-blue-100">
            How to test
          </h2>
          <ol className="list-decimal space-y-2 pl-5 text-blue-800 dark:text-blue-200">
            <li>Enable "Experimental Web Platform features" in chrome://flags</li>
            <li>Click the buttons to move the dot</li>
            <li>Notice how the scoped version keeps the dot clipped within its container</li>
            <li>Try showing the popover to see how it interacts with transitions</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function TransitionDemo({ type }: { type: 'document' | 'scoped' }) {
  const [position, setPosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('top-left');
  const [showPopover, setShowPopover] = useState(false);

  const positions = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const moveDot = (newPosition: typeof position) => {
    const container = document.getElementById(`container-${type}`);

    if (type === 'scoped' && container && 'startViewTransition' in container) {
      // Use scoped view transition
      try {
        (container as any).startViewTransition(() => {
          flushSync(() => {
            setPosition(newPosition);
          });
        });
      } catch (error) {
        console.error('Scoped transition error:', error);
        setPosition(newPosition);
      }
    } else if (type === 'document' && 'startViewTransition' in document) {
      // Use document view transition
      try {
        (document as any).startViewTransition(() => {
          flushSync(() => {
            setPosition(newPosition);
          });
        });
      } catch (error) {
        console.error('Document transition error:', error);
        setPosition(newPosition);
      }
    } else {
      // Fallback without transition
      setPosition(newPosition);
    }
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-zinc-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {type === 'document' ? 'Document-Scoped' : 'Element-Scoped'}
        </h2>
        <button
          onClick={() => setShowPopover(!showPopover)}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          {showPopover ? 'Hide' : 'Show'} Popover
        </button>
      </div>

      {/* Container with contain: layout for scoped transitions */}
      <div
        id={`container-${type}`}
        className="relative mb-6 h-64 overflow-hidden rounded-lg border-4 border-zinc-300 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-700"
        style={{ contain: type === 'scoped' ? 'layout' : 'none' }}
      >
        {/* The moving dot */}
        <div
          className={`absolute h-16 w-16 rounded-full bg-linear-to-br from-blue-500 to-purple-600 shadow-lg ${positions[position]}`}
          style={{
            viewTransitionName: `dot-${type}`,
          }}
        />

        {/* Popover that should appear above the scoped transition */}
        {showPopover && (
          <div
            className="absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-4 shadow-2xl dark:bg-zinc-900"
            style={{ transform: 'translate(-50%, -50%)' }}
          >
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              I'm a popover!
            </p>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              With scoped transitions, I appear above the dot.
            </p>
          </div>
        )}
      </div>

      {/* Control buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => moveDot('top-left')}
          disabled={position === 'top-left'}
          className="rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Top Left
        </button>
        <button
          onClick={() => moveDot('top-right')}
          disabled={position === 'top-right'}
          className="rounded-lg bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Top Right
        </button>
        <button
          onClick={() => moveDot('bottom-left')}
          disabled={position === 'bottom-left'}
          className="rounded-lg bg-orange-600 px-4 py-3 font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Bottom Left
        </button>
        <button
          onClick={() => moveDot('bottom-right')}
          disabled={position === 'bottom-right'}
          className="rounded-lg bg-red-600 px-4 py-3 font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Bottom Right
        </button>
      </div>

      <div className="mt-4 rounded-lg bg-zinc-100 p-3 dark:bg-zinc-700">
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          {type === 'document'
            ? 'Uses document.startViewTransition() - dot may overflow container'
            : 'Uses element.startViewTransition() - dot stays clipped within container'}
        </p>
      </div>
    </div>
  );
}
