import { describe, expect, it } from 'vitest';
import { normalizeTreeEntries, type GitHubTreeApiEntry } from './github-utils';

describe('normalizeTreeEntries', () => {
  it('sets path to the raw entry path unchanged', () => {
    const entries: GitHubTreeApiEntry[] = [
      { path: 'src/index.ts', type: 'blob' },
    ];

    const result = normalizeTreeEntries(entries);

    expect(result).toHaveLength(1);
    expect(result[0].path).toBe(entries[0].path);
  });

  it('sets name to the last path segment for a nested path', () => {
    const entries: GitHubTreeApiEntry[] = [
      { path: 'src/utils/helpers.ts', type: 'blob' },
    ];

    const result = normalizeTreeEntries(entries);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('helpers.ts');
  });

  it('sets name to the full path when there is no slash (root-level entry)', () => {
    const entries: GitHubTreeApiEntry[] = [{ path: 'README.md', type: 'blob' }];

    const result = normalizeTreeEntries(entries);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('README.md');
  });

  it('maps type "blob" to "file"', () => {
    const entries: GitHubTreeApiEntry[] = [{ path: 'index.ts', type: 'blob' }];

    const result = normalizeTreeEntries(entries);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('file');
  });

  it('maps type "tree" to "directory"', () => {
    const entries: GitHubTreeApiEntry[] = [{ path: 'src', type: 'tree' }];

    const result = normalizeTreeEntries(entries);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('directory');
  });

  it('maps type "commit" to "submodule"', () => {
    const entries: GitHubTreeApiEntry[] = [
      { path: 'vendor/lib', type: 'commit' },
    ];

    const result = normalizeTreeEntries(entries);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('submodule');
  });

  it('drops the entry entirely when type is an unrecognized string', () => {
    const entries: GitHubTreeApiEntry[] = [{ path: 'weird', type: 'symlink' }];

    const result = normalizeTreeEntries(entries);

    expect(result).toHaveLength(0);
  });

  it('sets depth to 0 for a root-level entry', () => {
    const entries: GitHubTreeApiEntry[] = [{ path: 'README.md', type: 'blob' }];

    const result = normalizeTreeEntries(entries);

    expect(result).toHaveLength(1);
    expect(result[0].depth).toBe(0);
  });

  it('sets depth to the number of path segments minus one for a nested entry', () => {
    const entries: GitHubTreeApiEntry[] = [
      { path: 'src/utils/helpers.ts', type: 'blob' },
    ];

    const result = normalizeTreeEntries(entries);

    expect(result).toHaveLength(1);
    expect(result[0].depth).toBe(entries[0].path.split('/').length - 1);
  });

  it('sets parentPath to null for a root-level entry', () => {
    const entries: GitHubTreeApiEntry[] = [{ path: 'README.md', type: 'blob' }];

    const result = normalizeTreeEntries(entries);

    expect(result).toHaveLength(1);
    expect(result[0].parentPath).toBeNull();
  });

  it('sets parentPath to the joined path minus the last segment for a nested entry', () => {
    const entries: GitHubTreeApiEntry[] = [
      { path: 'src/utils/helpers.ts', type: 'blob' },
    ];

    const result = normalizeTreeEntries(entries);

    expect(result).toHaveLength(1);
    expect(result[0].parentPath).toBe('src/utils');
  });

  it('sets extension to the lowercased text after the last dot in the name', () => {
    const entries: GitHubTreeApiEntry[] = [
      { path: 'src/App.TSX', type: 'blob' },
    ];

    const result = normalizeTreeEntries(entries);

    expect(result).toHaveLength(1);
    expect(result[0].extension).toBe('tsx');
  });

  it('sets extension to null when the name has no dot', () => {
    const entries: GitHubTreeApiEntry[] = [
      { path: 'Dockerfile', type: 'blob' },
    ];

    const result = normalizeTreeEntries(entries);

    expect(result).toHaveLength(1);
    expect(result[0].extension).toBe(null);
  });

  it('sets extension from only the final segment when the name has multiple dots', () => {
    const entries: GitHubTreeApiEntry[] = [
      { path: 'archive.tar.gz', type: 'blob' },
    ];

    const result = normalizeTreeEntries(entries);

    expect(result).toHaveLength(1);
    expect(result[0].extension).toBe('gz');
  });

  it('sets sizeBytes to the given size when present', () => {
    const entries: GitHubTreeApiEntry[] = [
      { path: 'index.ts', type: 'blob', size: 1234 },
    ];

    const result = normalizeTreeEntries(entries);

    expect(result).toHaveLength(1);
    expect(result[0].sizeBytes).toBe(1234);
  });

  it('sets sizeBytes to null when size is undefined', () => {
    const entries: GitHubTreeApiEntry[] = [{ path: 'index.ts', type: 'blob' }];

    const result = normalizeTreeEntries(entries);

    expect(result).toHaveLength(1);
    expect(result[0].sizeBytes).toBe(null);
  });

  it('sets sizeBytes to 0 when size is exactly 0, not null', () => {
    const entries: GitHubTreeApiEntry[] = [
      { path: 'empty.txt', type: 'blob', size: 0 },
    ];

    const result = normalizeTreeEntries(entries);

    expect(result).toHaveLength(1);
    expect(result[0].sizeBytes).toBe(0);
  });

  it('returns one normalized entry per accepted input entry, preserving order', () => {
    const entries: GitHubTreeApiEntry[] = [
      { path: 'a.ts', type: 'blob' },
      { path: 'src', type: 'tree' },
      { path: 'b.ts', type: 'blob' },
    ];

    const result = normalizeTreeEntries(entries);

    expect(result).toHaveLength(3);
    for (let i = 0; i < result.length; i++) {
      expect(result[i].path).toBe(entries[i].path);
    }
  });

  it('returns an empty array when given an empty entries array', () => {
    const entries: GitHubTreeApiEntry[] = [];

    const result = normalizeTreeEntries(entries);

    expect(result).toHaveLength(0);
  });

  it('sets extension to the text after the leading dot for a dotfile with no other dots', () => {
    const entries: GitHubTreeApiEntry[] = [
      { path: '.gitignore', type: 'blob' },
    ];

    const result = normalizeTreeEntries(entries);

    expect(result[0].extension).toBe('gitignore');
  });

  it('sets extension to null when the name ends in a dot with nothing after it', () => {
    const entries: GitHubTreeApiEntry[] = [{ path: 'file.', type: 'blob' }];

    const result = normalizeTreeEntries(entries);

    expect(result[0].extension).toBeNull();
  });

  it('treats a doubled slash in the path as producing an empty path segment', () => {
    const entries: GitHubTreeApiEntry[] = [
      { path: 'src//index.ts', type: 'blob' },
    ];

    const result = normalizeTreeEntries(entries);

    expect(result[0].depth).toBe(2);
    expect(result[0].parentPath).toBe('src/');
  });

  it('treats an empty-string path as a single, empty, root-level segment', () => {
    const entries: GitHubTreeApiEntry[] = [{ path: '', type: 'blob' }];

    const result = normalizeTreeEntries(entries);

    expect(result[0].depth).toBe(0);
    expect(result[0].parentPath).toBeNull();
    expect(result[0].name).toBe('');
  });
});
