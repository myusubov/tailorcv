import { resolveUnitRootOwner } from './resolve-unit-root-owner';
import { describe, it, expect } from 'vitest';

describe('resolveUnitRootOwner', () => {
  it('returns "." when the path has no parent directory', () => {
    const input = {
      path: 'next.config.ts',
      isAnchorSignal: false,
      anchorOwners: new Set<string>(),
    };

    const owner = resolveUnitRootOwner(input);

    expect(owner).toBe('.');
  });

  it('returns the directory containing the anchor file', () => {
    const input = {
      path: 'apps/frontend/next.config.ts',
      isAnchorSignal: true,
      anchorOwners: new Set<string>(),
    };

    const owner = resolveUnitRootOwner(input);

    expect(owner).toBe('apps/frontend');
  });

  it('does not attribute a path to an anchor owner that is only a string prefix, not a path prefix', () => {
    const input = {
      path: 'apps/web-admin/src/components/button.tsx',
      isAnchorSignal: false,
      anchorOwners: new Set<string>(['apps/web-admin', 'apps/web']),
    };

    const owner = resolveUnitRootOwner(input);

    expect(owner).toBe('apps/web-admin');
  });

  it('attributes a nested path to its innermost enclosing anchor owner', () => {
    const input = {
      path: 'apps/web/legacy/src/components/button.tsx',
      isAnchorSignal: false,
      anchorOwners: new Set<string>(['apps/web', 'apps/web/legacy']),
    };

    const owner = resolveUnitRootOwner(input);

    expect(owner).toBe('apps/web/legacy');
  });

  it('adopts an anchor owner whose path equals the evidence path exactly', () => {
    const input = {
      path: 'workers/api',
      isAnchorSignal: false,
      anchorOwners: new Set(['workers/api']),
    };

    const owner = resolveUnitRootOwner(input);

    expect(owner).toBe('workers/api');
  });

  it('falls back to the generic resolver when no anchor owner encloses the path', () => {
    const input = {
      path: 'services/foo/src/x.ts',
      isAnchorSignal: false,
      anchorOwners: new Set(['apps/web']),
    };

    const owner = resolveUnitRootOwner(input);

    expect(owner).toBe('services/foo');
  });

  it('falls back to the generic resolver when there are no anchor owners', () => {
    const input = {
      path: 'apps/thing/pages/x.vue',
      isAnchorSignal: false,
      anchorOwners: new Set<string>(),
    };

    const owner = resolveUnitRootOwner(input);

    expect(owner).toBe('apps/thing');
  });

  it('returns "." for a single-segment path even when it is the anchor signal', () => {
    const input = {
      path: 'next.config.ts',
      isAnchorSignal: true,
      anchorOwners: new Set(['next.config.ts']),
    };

    const owner = resolveUnitRootOwner(input);

    expect(owner).toBe('.');
  });

  it('does not let a repository-root anchor owner greedily claim a path under no deeper anchor', () => {
    const input = {
      path: 'apps/thing/app/page.tsx',
      isAnchorSignal: false,
      anchorOwners: new Set<string>(['.']),
    };

    const owner = resolveUnitRootOwner(input);

    expect(owner).toBe('apps/thing');
  });
});
