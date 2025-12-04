'use client';

import { invalidateCache } from '@/lib/data/page.actions';

const InvalidateButton = () => {
  return (
    <button
      onClick={invalidateCache}
      className="mb-4 rounded-md bg-blue-500 px-4 py-2 text-white"
    >
      Invalidate Cache
    </button>
  );
};

export default InvalidateButton;
