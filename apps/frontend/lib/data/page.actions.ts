'use server';

import { refresh, updateTag } from 'next/cache';

export const invalidateCache = async () => {
  // updateTag("posts")
  refresh();
};
