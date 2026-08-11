import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Copies the repository-generated Prisma runtime into the compiled backend.
 *
 * Inputs are resolved relative to this script. The operation replaces
 * `dist/prisma` after TypeScript compilation so production imports retain the
 * same relative paths as source imports. Prisma generation must run first.
 */
const backendDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceDirectory = resolve(backendDirectory, 'prisma');
const destinationDirectory = resolve(backendDirectory, 'dist/prisma');

await rm(destinationDirectory, { recursive: true, force: true });
await mkdir(dirname(destinationDirectory), { recursive: true });
await cp(sourceDirectory, destinationDirectory, { recursive: true });
