import { describe, expect, it } from 'vitest';
import type { RepoTreeEntry } from './project-structure-analyzer.types';
import type { AreaCandidate } from './project-structure-detected-areas.types';
import { applyDetectedAreaRules } from './project-structure-detected-area-rules';
import { buildEntryIndex } from './project-structure-entry-index';

describe('same-owner detector claims', () => {
  describe('Next.js (meta) vs React (parent)', () => {
    it('keeps both claims when Next.js and React evidence share one owner path', () => {
      const entries: RepoTreeEntry[] = [
        {
          path: 'next.config.js',
          name: 'next.config.js',
          type: 'file',
          depth: 0,
          parentPath: null,
          extension: 'js',
          sizeBytes: 180,
        },
        {
          path: 'package.json',
          name: 'package.json',
          type: 'file',
          depth: 0,
          parentPath: null,
          extension: 'json',
          sizeBytes: 612,
        },
        {
          path: 'app',
          name: 'app',
          type: 'directory',
          depth: 0,
          parentPath: null,
          extension: null,
          sizeBytes: null,
        },
        {
          path: 'app/layout.tsx',
          name: 'layout.tsx',
          type: 'file',
          depth: 1,
          parentPath: 'app',
          extension: 'tsx',
          sizeBytes: 940,
        },
        {
          path: 'app/page.tsx',
          name: 'page.tsx',
          type: 'file',
          depth: 1,
          parentPath: 'app',
          extension: 'tsx',
          sizeBytes: 610,
        },
        {
          path: 'src',
          name: 'src',
          type: 'directory',
          depth: 0,
          parentPath: null,
          extension: null,
          sizeBytes: null,
        },
        {
          path: 'src/App.tsx',
          name: 'App.tsx',
          type: 'file',
          depth: 1,
          parentPath: 'src',
          extension: 'tsx',
          sizeBytes: 1024,
        },
        {
          path: 'src/components',
          name: 'components',
          type: 'directory',
          depth: 1,
          parentPath: 'src',
          extension: null,
          sizeBytes: null,
        },
        {
          path: 'src/components/Header.tsx',
          name: 'Header.tsx',
          type: 'file',
          depth: 2,
          parentPath: 'src/components',
          extension: 'tsx',
          sizeBytes: 720,
        },
      ];
      const index = buildEntryIndex(entries);
      const candidates = new Map<string, AreaCandidate>();

      applyDetectedAreaRules({ candidates, index });

      expect([...candidates.keys()].sort()).toEqual([
        'Frontend app::.::Next.js',
        'Frontend app::.::React',
      ]);
    });

    it('keeps the React claim alone when no Next.js evidence exists', () => {
      const entries: RepoTreeEntry[] = [
        {
          path: 'package.json',
          name: 'package.json',
          type: 'file',
          depth: 0,
          parentPath: null,
          extension: 'json',
          sizeBytes: 540,
        },
        {
          path: 'src',
          name: 'src',
          type: 'directory',
          depth: 0,
          parentPath: null,
          extension: null,
          sizeBytes: null,
        },
        {
          path: 'src/App.tsx',
          name: 'App.tsx',
          type: 'file',
          depth: 1,
          parentPath: 'src',
          extension: 'tsx',
          sizeBytes: 980,
        },
        {
          path: 'src/main.tsx',
          name: 'main.tsx',
          type: 'file',
          depth: 1,
          parentPath: 'src',
          extension: 'tsx',
          sizeBytes: 260,
        },
        {
          path: 'src/components',
          name: 'components',
          type: 'directory',
          depth: 1,
          parentPath: 'src',
          extension: null,
          sizeBytes: null,
        },
        {
          path: 'src/components/Header.tsx',
          name: 'Header.tsx',
          type: 'file',
          depth: 2,
          parentPath: 'src/components',
          extension: 'tsx',
          sizeBytes: 720,
        },
      ];
      const index = buildEntryIndex(entries);
      const candidates = new Map<string, AreaCandidate>();

      applyDetectedAreaRules({ candidates, index });

      expect([...candidates.keys()]).toEqual(['Frontend app::.::React']);
    });

    it('keeps the Next.js claim alone when no React evidence exists', () => {
      const entries: RepoTreeEntry[] = [
        {
          path: 'next.config.js',
          name: 'next.config.js',
          type: 'file',
          depth: 0,
          parentPath: null,
          extension: 'js',
          sizeBytes: 180,
        },
        {
          path: 'app',
          name: 'app',
          type: 'directory',
          depth: 0,
          parentPath: null,
          extension: null,
          sizeBytes: null,
        },
        {
          path: 'app/layout.tsx',
          name: 'layout.tsx',
          type: 'file',
          depth: 1,
          parentPath: 'app',
          extension: 'tsx',
          sizeBytes: 900,
        },
        {
          path: 'app/page.tsx',
          name: 'page.tsx',
          type: 'file',
          depth: 1,
          parentPath: 'app',
          extension: 'tsx',
          sizeBytes: 610,
        },
      ];
      const index = buildEntryIndex(entries);
      const candidates = new Map<string, AreaCandidate>();

      applyDetectedAreaRules({ candidates, index });

      expect([...candidates.keys()]).toEqual(['Frontend app::.::Next.js']);
    });
  });

  describe('Nuxt (meta) vs Vue (parent)', () => {
    it('keeps both claims when Nuxt and Vue evidence share one owner path', () => {
      const entries: RepoTreeEntry[] = [
        {
          path: 'nuxt.config.ts',
          name: 'nuxt.config.ts',
          type: 'file',
          depth: 0,
          parentPath: null,
          extension: 'ts',
          sizeBytes: 210,
        },
        {
          path: 'package.json',
          name: 'package.json',
          type: 'file',
          depth: 0,
          parentPath: null,
          extension: 'json',
          sizeBytes: 588,
        },
        {
          path: 'pages',
          name: 'pages',
          type: 'directory',
          depth: 0,
          parentPath: null,
          extension: null,
          sizeBytes: null,
        },
        {
          path: 'pages/index.vue',
          name: 'index.vue',
          type: 'file',
          depth: 1,
          parentPath: 'pages',
          extension: 'vue',
          sizeBytes: 430,
        },
        {
          path: 'pages/about.vue',
          name: 'about.vue',
          type: 'file',
          depth: 1,
          parentPath: 'pages',
          extension: 'vue',
          sizeBytes: 210,
        },
        {
          path: 'src',
          name: 'src',
          type: 'directory',
          depth: 0,
          parentPath: null,
          extension: null,
          sizeBytes: null,
        },
        {
          path: 'src/App.vue',
          name: 'App.vue',
          type: 'file',
          depth: 1,
          parentPath: 'src',
          extension: 'vue',
          sizeBytes: 640,
        },
        {
          path: 'src/main.ts',
          name: 'main.ts',
          type: 'file',
          depth: 1,
          parentPath: 'src',
          extension: 'ts',
          sizeBytes: 190,
        },
      ];
      const index = buildEntryIndex(entries);
      const candidates = new Map<string, AreaCandidate>();

      applyDetectedAreaRules({ candidates, index });

      expect([...candidates.keys()].sort()).toEqual([
        'Frontend app::.::Nuxt',
        'Frontend app::.::Vue',
      ]);
    });

    it('keeps the Vue claim alone when no Nuxt evidence exists', () => {
      const entries: RepoTreeEntry[] = [
        {
          path: 'package.json',
          name: 'package.json',
          type: 'file',
          depth: 0,
          parentPath: null,
          extension: 'json',
          sizeBytes: 520,
        },
        {
          path: 'src',
          name: 'src',
          type: 'directory',
          depth: 0,
          parentPath: null,
          extension: null,
          sizeBytes: null,
        },
        {
          path: 'src/App.vue',
          name: 'App.vue',
          type: 'file',
          depth: 1,
          parentPath: 'src',
          extension: 'vue',
          sizeBytes: 610,
        },
        {
          path: 'src/main.ts',
          name: 'main.ts',
          type: 'file',
          depth: 1,
          parentPath: 'src',
          extension: 'ts',
          sizeBytes: 180,
        },
      ];
      const index = buildEntryIndex(entries);
      const candidates = new Map<string, AreaCandidate>();

      applyDetectedAreaRules({ candidates, index });

      expect([...candidates.keys()]).toEqual(['Frontend app::.::Vue']);
    });

    it('keeps the Nuxt claim alone when no Vue evidence exists', () => {
      const entries: RepoTreeEntry[] = [
        {
          path: 'nuxt.config.ts',
          name: 'nuxt.config.ts',
          type: 'file',
          depth: 0,
          parentPath: null,
          extension: 'ts',
          sizeBytes: 210,
        },
        {
          path: 'pages',
          name: 'pages',
          type: 'directory',
          depth: 0,
          parentPath: null,
          extension: null,
          sizeBytes: null,
        },
        {
          path: 'pages/index.vue',
          name: 'index.vue',
          type: 'file',
          depth: 1,
          parentPath: 'pages',
          extension: 'vue',
          sizeBytes: 430,
        },
      ];
      const index = buildEntryIndex(entries);
      const candidates = new Map<string, AreaCandidate>();

      applyDetectedAreaRules({ candidates, index });

      expect([...candidates.keys()]).toEqual(['Frontend app::.::Nuxt']);
    });
  });

  describe('React Router (meta) vs React (parent)', () => {
    it('keeps both claims when React Router and React evidence share one owner path', () => {
      const entries: RepoTreeEntry[] = [
        {
          path: 'vite.config.ts',
          name: 'vite.config.ts',
          type: 'file',
          depth: 0,
          parentPath: null,
          extension: 'ts',
          sizeBytes: 260,
        },
        {
          path: 'package.json',
          name: 'package.json',
          type: 'file',
          depth: 0,
          parentPath: null,
          extension: 'json',
          sizeBytes: 560,
        },
        {
          path: 'app',
          name: 'app',
          type: 'directory',
          depth: 0,
          parentPath: null,
          extension: null,
          sizeBytes: null,
        },
        {
          path: 'app/root.tsx',
          name: 'root.tsx',
          type: 'file',
          depth: 1,
          parentPath: 'app',
          extension: 'tsx',
          sizeBytes: 480,
        },
        {
          path: 'app/routes.ts',
          name: 'routes.ts',
          type: 'file',
          depth: 1,
          parentPath: 'app',
          extension: 'ts',
          sizeBytes: 210,
        },
        {
          path: 'src',
          name: 'src',
          type: 'directory',
          depth: 0,
          parentPath: null,
          extension: null,
          sizeBytes: null,
        },
        {
          path: 'src/App.tsx',
          name: 'App.tsx',
          type: 'file',
          depth: 1,
          parentPath: 'src',
          extension: 'tsx',
          sizeBytes: 900,
        },
        {
          path: 'src/components',
          name: 'components',
          type: 'directory',
          depth: 1,
          parentPath: 'src',
          extension: null,
          sizeBytes: null,
        },
        {
          path: 'src/components/Header.tsx',
          name: 'Header.tsx',
          type: 'file',
          depth: 2,
          parentPath: 'src/components',
          extension: 'tsx',
          sizeBytes: 720,
        },
      ];
      const index = buildEntryIndex(entries);
      const candidates = new Map<string, AreaCandidate>();

      applyDetectedAreaRules({ candidates, index });

      expect([...candidates.keys()].sort()).toEqual([
        'Frontend app::.::React',
        'Frontend app::.::React Router',
      ]);
    });

    it('keeps the React claim alone when no React Router evidence exists', () => {
      const entries: RepoTreeEntry[] = [
        {
          path: 'package.json',
          name: 'package.json',
          type: 'file',
          depth: 0,
          parentPath: null,
          extension: 'json',
          sizeBytes: 540,
        },
        {
          path: 'src',
          name: 'src',
          type: 'directory',
          depth: 0,
          parentPath: null,
          extension: null,
          sizeBytes: null,
        },
        {
          path: 'src/App.tsx',
          name: 'App.tsx',
          type: 'file',
          depth: 1,
          parentPath: 'src',
          extension: 'tsx',
          sizeBytes: 980,
        },
        {
          path: 'src/components',
          name: 'components',
          type: 'directory',
          depth: 1,
          parentPath: 'src',
          extension: null,
          sizeBytes: null,
        },
        {
          path: 'src/components/Header.tsx',
          name: 'Header.tsx',
          type: 'file',
          depth: 2,
          parentPath: 'src/components',
          extension: 'tsx',
          sizeBytes: 720,
        },
      ];
      const index = buildEntryIndex(entries);
      const candidates = new Map<string, AreaCandidate>();

      applyDetectedAreaRules({ candidates, index });

      expect([...candidates.keys()]).toEqual(['Frontend app::.::React']);
    });

    it('keeps the React Router claim alone when no plain React evidence exists', () => {
      const entries: RepoTreeEntry[] = [
        {
          path: 'vite.config.ts',
          name: 'vite.config.ts',
          type: 'file',
          depth: 0,
          parentPath: null,
          extension: 'ts',
          sizeBytes: 260,
        },
        {
          path: 'app',
          name: 'app',
          type: 'directory',
          depth: 0,
          parentPath: null,
          extension: null,
          sizeBytes: null,
        },
        {
          path: 'app/root.tsx',
          name: 'root.tsx',
          type: 'file',
          depth: 1,
          parentPath: 'app',
          extension: 'tsx',
          sizeBytes: 480,
        },
        {
          path: 'app/routes.ts',
          name: 'routes.ts',
          type: 'file',
          depth: 1,
          parentPath: 'app',
          extension: 'ts',
          sizeBytes: 210,
        },
      ];
      const index = buildEntryIndex(entries);
      const candidates = new Map<string, AreaCandidate>();

      applyDetectedAreaRules({ candidates, index });

      expect([...candidates.keys()]).toEqual(['Frontend app::.::React Router']);
    });
  });

  describe('SvelteKit (meta) vs Svelte (parent)', () => {
    it('keeps both claims when SvelteKit and Svelte evidence share one owner path', () => {
      const entries: RepoTreeEntry[] = [
        {
          path: 'svelte.config.js',
          name: 'svelte.config.js',
          type: 'file',
          depth: 0,
          parentPath: null,
          extension: 'js',
          sizeBytes: 240,
        },
        {
          path: 'package.json',
          name: 'package.json',
          type: 'file',
          depth: 0,
          parentPath: null,
          extension: 'json',
          sizeBytes: 520,
        },
        {
          path: 'src',
          name: 'src',
          type: 'directory',
          depth: 0,
          parentPath: null,
          extension: null,
          sizeBytes: null,
        },
        {
          path: 'src/routes',
          name: 'routes',
          type: 'directory',
          depth: 1,
          parentPath: 'src',
          extension: null,
          sizeBytes: null,
        },
        {
          path: 'src/routes/+page.svelte',
          name: '+page.svelte',
          type: 'file',
          depth: 2,
          parentPath: 'src/routes',
          extension: 'svelte',
          sizeBytes: 380,
        },
        {
          path: 'src/app.html',
          name: 'app.html',
          type: 'file',
          depth: 1,
          parentPath: 'src',
          extension: 'html',
          sizeBytes: 310,
        },
        {
          path: 'src/App.svelte',
          name: 'App.svelte',
          type: 'file',
          depth: 1,
          parentPath: 'src',
          extension: 'svelte',
          sizeBytes: 560,
        },
        {
          path: 'src/main.js',
          name: 'main.js',
          type: 'file',
          depth: 1,
          parentPath: 'src',
          extension: 'js',
          sizeBytes: 170,
        },
      ];
      const index = buildEntryIndex(entries);
      const candidates = new Map<string, AreaCandidate>();

      applyDetectedAreaRules({ candidates, index });

      expect([...candidates.keys()].sort()).toEqual([
        'Frontend app::.::Svelte',
        'Frontend app::.::SvelteKit',
      ]);
    });

    it('keeps the Svelte claim alone when no SvelteKit evidence exists', () => {
      const entries: RepoTreeEntry[] = [
        {
          path: 'package.json',
          name: 'package.json',
          type: 'file',
          depth: 0,
          parentPath: null,
          extension: 'json',
          sizeBytes: 500,
        },
        {
          path: 'src',
          name: 'src',
          type: 'directory',
          depth: 0,
          parentPath: null,
          extension: null,
          sizeBytes: null,
        },
        {
          path: 'src/App.svelte',
          name: 'App.svelte',
          type: 'file',
          depth: 1,
          parentPath: 'src',
          extension: 'svelte',
          sizeBytes: 560,
        },
        {
          path: 'src/main.js',
          name: 'main.js',
          type: 'file',
          depth: 1,
          parentPath: 'src',
          extension: 'js',
          sizeBytes: 170,
        },
      ];
      const index = buildEntryIndex(entries);
      const candidates = new Map<string, AreaCandidate>();

      applyDetectedAreaRules({ candidates, index });

      expect([...candidates.keys()]).toEqual(['Frontend app::.::Svelte']);
    });

    it('keeps the SvelteKit claim alone when no plain Svelte evidence exists', () => {
      const entries: RepoTreeEntry[] = [
        {
          path: 'svelte.config.js',
          name: 'svelte.config.js',
          type: 'file',
          depth: 0,
          parentPath: null,
          extension: 'js',
          sizeBytes: 240,
        },
        {
          path: 'src',
          name: 'src',
          type: 'directory',
          depth: 0,
          parentPath: null,
          extension: null,
          sizeBytes: null,
        },
        {
          path: 'src/routes',
          name: 'routes',
          type: 'directory',
          depth: 1,
          parentPath: 'src',
          extension: null,
          sizeBytes: null,
        },
        {
          path: 'src/routes/+page.svelte',
          name: '+page.svelte',
          type: 'file',
          depth: 2,
          parentPath: 'src/routes',
          extension: 'svelte',
          sizeBytes: 380,
        },
        {
          path: 'src/app.html',
          name: 'app.html',
          type: 'file',
          depth: 1,
          parentPath: 'src',
          extension: 'html',
          sizeBytes: 310,
        },
      ];
      const index = buildEntryIndex(entries);
      const candidates = new Map<string, AreaCandidate>();

      applyDetectedAreaRules({ candidates, index });

      expect([...candidates.keys()]).toEqual(['Frontend app::.::SvelteKit']);
    });
  });

  describe('Expo (meta) vs React Native (parent)', () => {
    it('keeps both claims when Expo and React Native evidence share one owner path', () => {
      const entries: RepoTreeEntry[] = [
        {
          path: 'app.config.ts',
          name: 'app.config.ts',
          type: 'file',
          depth: 0,
          parentPath: null,
          extension: 'ts',
          sizeBytes: 260,
        },
        {
          path: 'react-native.config.js',
          name: 'react-native.config.js',
          type: 'file',
          depth: 0,
          parentPath: null,
          extension: 'js',
          sizeBytes: 90,
        },
        {
          path: 'package.json',
          name: 'package.json',
          type: 'file',
          depth: 0,
          parentPath: null,
          extension: 'json',
          sizeBytes: 640,
        },
        {
          path: 'metro.config.js',
          name: 'metro.config.js',
          type: 'file',
          depth: 0,
          parentPath: null,
          extension: 'js',
          sizeBytes: 150,
        },
        {
          path: 'App.tsx',
          name: 'App.tsx',
          type: 'file',
          depth: 0,
          parentPath: null,
          extension: 'tsx',
          sizeBytes: 720,
        },
        {
          path: 'index.js',
          name: 'index.js',
          type: 'file',
          depth: 0,
          parentPath: null,
          extension: 'js',
          sizeBytes: 90,
        },
      ];
      const index = buildEntryIndex(entries);
      const candidates = new Map<string, AreaCandidate>();

      applyDetectedAreaRules({ candidates, index });

      expect([...candidates.keys()].sort()).toEqual([
        'Mobile app::.::Expo',
        'Mobile app::.::React Native',
      ]);
    });

    it('keeps the React Native claim alone when no Expo evidence exists', () => {
      const entries: RepoTreeEntry[] = [
        {
          path: 'react-native.config.js',
          name: 'react-native.config.js',
          type: 'file',
          depth: 0,
          parentPath: null,
          extension: 'js',
          sizeBytes: 90,
        },
        {
          path: 'package.json',
          name: 'package.json',
          type: 'file',
          depth: 0,
          parentPath: null,
          extension: 'json',
          sizeBytes: 610,
        },
        {
          path: 'metro.config.js',
          name: 'metro.config.js',
          type: 'file',
          depth: 0,
          parentPath: null,
          extension: 'js',
          sizeBytes: 150,
        },
        {
          path: 'index.js',
          name: 'index.js',
          type: 'file',
          depth: 0,
          parentPath: null,
          extension: 'js',
          sizeBytes: 90,
        },
        {
          path: 'App.tsx',
          name: 'App.tsx',
          type: 'file',
          depth: 0,
          parentPath: null,
          extension: 'tsx',
          sizeBytes: 700,
        },
      ];
      const index = buildEntryIndex(entries);
      const candidates = new Map<string, AreaCandidate>();

      applyDetectedAreaRules({ candidates, index });

      expect([...candidates.keys()]).toEqual(['Mobile app::.::React Native']);
    });

    it('keeps the Expo claim alone when no React Native-specific evidence exists', () => {
      const entries: RepoTreeEntry[] = [
        {
          path: 'app.config.ts',
          name: 'app.config.ts',
          type: 'file',
          depth: 0,
          parentPath: null,
          extension: 'ts',
          sizeBytes: 260,
        },
        {
          path: 'eas.json',
          name: 'eas.json',
          type: 'file',
          depth: 0,
          parentPath: null,
          extension: 'json',
          sizeBytes: 140,
        },
        {
          path: 'package.json',
          name: 'package.json',
          type: 'file',
          depth: 0,
          parentPath: null,
          extension: 'json',
          sizeBytes: 640,
        },
        {
          path: 'App.tsx',
          name: 'App.tsx',
          type: 'file',
          depth: 0,
          parentPath: null,
          extension: 'tsx',
          sizeBytes: 720,
        },
      ];
      const index = buildEntryIndex(entries);
      const candidates = new Map<string, AreaCandidate>();

      applyDetectedAreaRules({ candidates, index });

      expect([...candidates.keys()]).toEqual(['Mobile app::.::Expo']);
    });
  });

  describe('Nest (meta) vs Express (parent)', () => {
    it('keeps both claims when Nest and Express evidence share one owner path', () => {
      const entries: RepoTreeEntry[] = [
        {
          path: 'nest-cli.json',
          name: 'nest-cli.json',
          type: 'file',
          depth: 0,
          parentPath: null,
          extension: 'json',
          sizeBytes: 140,
        },
        {
          path: 'package.json',
          name: 'package.json',
          type: 'file',
          depth: 0,
          parentPath: null,
          extension: 'json',
          sizeBytes: 720,
        },
        {
          path: 'src',
          name: 'src',
          type: 'directory',
          depth: 0,
          parentPath: null,
          extension: null,
          sizeBytes: null,
        },
        {
          path: 'src/main.ts',
          name: 'main.ts',
          type: 'file',
          depth: 1,
          parentPath: 'src',
          extension: 'ts',
          sizeBytes: 310,
        },
        {
          path: 'src/app.module.ts',
          name: 'app.module.ts',
          type: 'file',
          depth: 1,
          parentPath: 'src',
          extension: 'ts',
          sizeBytes: 420,
        },
        {
          path: 'src/server.js',
          name: 'server.js',
          type: 'file',
          depth: 1,
          parentPath: 'src',
          extension: 'js',
          sizeBytes: 260,
        },
        {
          path: 'src/routes',
          name: 'routes',
          type: 'directory',
          depth: 1,
          parentPath: 'src',
          extension: null,
          sizeBytes: null,
        },
        {
          path: 'src/routes/users.js',
          name: 'users.js',
          type: 'file',
          depth: 2,
          parentPath: 'src/routes',
          extension: 'js',
          sizeBytes: 340,
        },
        {
          path: 'src/controllers',
          name: 'controllers',
          type: 'directory',
          depth: 1,
          parentPath: 'src',
          extension: null,
          sizeBytes: null,
        },
        {
          path: 'src/controllers/usersController.js',
          name: 'usersController.js',
          type: 'file',
          depth: 2,
          parentPath: 'src/controllers',
          extension: 'js',
          sizeBytes: 410,
        },
        {
          path: 'src/middlewares',
          name: 'middlewares',
          type: 'directory',
          depth: 1,
          parentPath: 'src',
          extension: null,
          sizeBytes: null,
        },
        {
          path: 'src/middlewares/auth.js',
          name: 'auth.js',
          type: 'file',
          depth: 2,
          parentPath: 'src/middlewares',
          extension: 'js',
          sizeBytes: 180,
        },
      ];
      const index = buildEntryIndex(entries);
      const candidates = new Map<string, AreaCandidate>();

      applyDetectedAreaRules({ candidates, index });

      expect([...candidates.keys()].sort()).toEqual([
        'Backend API::.::Express.js',
        'Backend API::.::NestJS',
      ]);
    });

    it('keeps the Express claim alone when no Nest evidence exists', () => {
      const entries: RepoTreeEntry[] = [
        {
          path: 'package.json',
          name: 'package.json',
          type: 'file',
          depth: 0,
          parentPath: null,
          extension: 'json',
          sizeBytes: 480,
        },
        {
          path: 'src',
          name: 'src',
          type: 'directory',
          depth: 0,
          parentPath: null,
          extension: null,
          sizeBytes: null,
        },
        {
          path: 'src/server.js',
          name: 'server.js',
          type: 'file',
          depth: 1,
          parentPath: 'src',
          extension: 'js',
          sizeBytes: 260,
        },
        {
          path: 'src/routes',
          name: 'routes',
          type: 'directory',
          depth: 1,
          parentPath: 'src',
          extension: null,
          sizeBytes: null,
        },
        {
          path: 'src/routes/users.js',
          name: 'users.js',
          type: 'file',
          depth: 2,
          parentPath: 'src/routes',
          extension: 'js',
          sizeBytes: 340,
        },
        {
          path: 'src/controllers',
          name: 'controllers',
          type: 'directory',
          depth: 1,
          parentPath: 'src',
          extension: null,
          sizeBytes: null,
        },
        {
          path: 'src/controllers/usersController.js',
          name: 'usersController.js',
          type: 'file',
          depth: 2,
          parentPath: 'src/controllers',
          extension: 'js',
          sizeBytes: 410,
        },
        {
          path: 'src/middlewares',
          name: 'middlewares',
          type: 'directory',
          depth: 1,
          parentPath: 'src',
          extension: null,
          sizeBytes: null,
        },
        {
          path: 'src/middlewares/auth.js',
          name: 'auth.js',
          type: 'file',
          depth: 2,
          parentPath: 'src/middlewares',
          extension: 'js',
          sizeBytes: 180,
        },
      ];
      const index = buildEntryIndex(entries);
      const candidates = new Map<string, AreaCandidate>();

      applyDetectedAreaRules({ candidates, index });

      expect([...candidates.keys()]).toEqual(['Backend API::.::Express.js']);
    });

    it('keeps the Nest claim alone when no Express-specific evidence exists', () => {
      const entries: RepoTreeEntry[] = [
        {
          path: 'nest-cli.json',
          name: 'nest-cli.json',
          type: 'file',
          depth: 0,
          parentPath: null,
          extension: 'json',
          sizeBytes: 140,
        },
        {
          path: 'src',
          name: 'src',
          type: 'directory',
          depth: 0,
          parentPath: null,
          extension: null,
          sizeBytes: null,
        },
        {
          path: 'src/main.ts',
          name: 'main.ts',
          type: 'file',
          depth: 1,
          parentPath: 'src',
          extension: 'ts',
          sizeBytes: 310,
        },
        {
          path: 'src/app.module.ts',
          name: 'app.module.ts',
          type: 'file',
          depth: 1,
          parentPath: 'src',
          extension: 'ts',
          sizeBytes: 420,
        },
      ];
      const index = buildEntryIndex(entries);
      const candidates = new Map<string, AreaCandidate>();

      applyDetectedAreaRules({ candidates, index });

      expect([...candidates.keys()]).toEqual(['Backend API::.::NestJS']);
    });
  });

  describe('claims on different owner paths', () => {
    it('keeps React and Next.js claims fully separate when they live in different apps', () => {
      const entries: RepoTreeEntry[] = [
        {
          path: 'apps',
          name: 'apps',
          type: 'directory',
          depth: 0,
          parentPath: null,
          extension: null,
          sizeBytes: null,
        },
        {
          path: 'apps/marketing',
          name: 'marketing',
          type: 'directory',
          depth: 1,
          parentPath: 'apps',
          extension: null,
          sizeBytes: null,
        },
        {
          path: 'apps/marketing/next.config.js',
          name: 'next.config.js',
          type: 'file',
          depth: 2,
          parentPath: 'apps/marketing',
          extension: 'js',
          sizeBytes: 180,
        },
        {
          path: 'apps/marketing/app',
          name: 'app',
          type: 'directory',
          depth: 2,
          parentPath: 'apps/marketing',
          extension: null,
          sizeBytes: null,
        },
        {
          path: 'apps/marketing/app/layout.tsx',
          name: 'layout.tsx',
          type: 'file',
          depth: 3,
          parentPath: 'apps/marketing/app',
          extension: 'tsx',
          sizeBytes: 900,
        },
        {
          path: 'apps/admin',
          name: 'admin',
          type: 'directory',
          depth: 1,
          parentPath: 'apps',
          extension: null,
          sizeBytes: null,
        },
        {
          path: 'apps/admin/src',
          name: 'src',
          type: 'directory',
          depth: 2,
          parentPath: 'apps/admin',
          extension: null,
          sizeBytes: null,
        },
        {
          path: 'apps/admin/src/App.tsx',
          name: 'App.tsx',
          type: 'file',
          depth: 3,
          parentPath: 'apps/admin/src',
          extension: 'tsx',
          sizeBytes: 980,
        },
        {
          path: 'apps/admin/src/components',
          name: 'components',
          type: 'directory',
          depth: 3,
          parentPath: 'apps/admin/src',
          extension: null,
          sizeBytes: null,
        },
        {
          path: 'apps/admin/src/components/Header.tsx',
          name: 'Header.tsx',
          type: 'file',
          depth: 4,
          parentPath: 'apps/admin/src/components',
          extension: 'tsx',
          sizeBytes: 720,
        },
      ];
      const index = buildEntryIndex(entries);
      const candidates = new Map<string, AreaCandidate>();

      applyDetectedAreaRules({ candidates, index });

      expect([...candidates.keys()].sort()).toEqual([
        'Frontend app::apps/admin::React',
        'Frontend app::apps/marketing::Next.js',
      ]);
    });
  });
});

describe('nested-host claims (Flutter vs native Android/iOS shell)', () => {
  it('redirects a deeply-nested bundled Android Gradle module to the Flutter root instead of its own wrapper directory', () => {
    const entries: RepoTreeEntry[] = [
      {
        path: 'pubspec.yaml',
        name: 'pubspec.yaml',
        type: 'file',
        depth: 0,
        parentPath: null,
        extension: 'yaml',
        sizeBytes: 220,
      },
      {
        path: '.metadata',
        name: '.metadata',
        type: 'file',
        depth: 0,
        parentPath: null,
        extension: null,
        sizeBytes: 140,
      },
      {
        path: 'lib',
        name: 'lib',
        type: 'directory',
        depth: 0,
        parentPath: null,
        extension: null,
        sizeBytes: null,
      },
      {
        path: 'lib/main.dart',
        name: 'main.dart',
        type: 'file',
        depth: 1,
        parentPath: 'lib',
        extension: 'dart',
        sizeBytes: 480,
      },
      {
        path: 'android',
        name: 'android',
        type: 'directory',
        depth: 0,
        parentPath: null,
        extension: null,
        sizeBytes: null,
      },
      {
        path: 'android/build.gradle',
        name: 'build.gradle',
        type: 'file',
        depth: 1,
        parentPath: 'android',
        extension: 'gradle',
        sizeBytes: 210,
      },
      {
        path: 'android/app',
        name: 'app',
        type: 'directory',
        depth: 1,
        parentPath: 'android',
        extension: null,
        sizeBytes: null,
      },
      {
        path: 'android/app/build.gradle',
        name: 'build.gradle',
        type: 'file',
        depth: 2,
        parentPath: 'android/app',
        extension: 'gradle',
        sizeBytes: 640,
      },
      {
        path: 'android/plugin',
        name: 'plugin',
        type: 'directory',
        depth: 1,
        parentPath: 'android',
        extension: null,
        sizeBytes: null,
      },
      {
        path: 'android/plugin/build.gradle',
        name: 'build.gradle',
        type: 'file',
        depth: 2,
        parentPath: 'android/plugin',
        extension: 'gradle',
        sizeBytes: 190,
      },
      {
        path: 'android/plugin/src',
        name: 'src',
        type: 'directory',
        depth: 2,
        parentPath: 'android/plugin',
        extension: null,
        sizeBytes: null,
      },
      {
        path: 'android/plugin/src/main',
        name: 'main',
        type: 'directory',
        depth: 3,
        parentPath: 'android/plugin/src',
        extension: null,
        sizeBytes: null,
      },
      {
        path: 'android/plugin/src/main/AndroidManifest.xml',
        name: 'AndroidManifest.xml',
        type: 'file',
        depth: 4,
        parentPath: 'android/plugin/src/main',
        extension: 'xml',
        sizeBytes: 310,
      },
    ];
    const index = buildEntryIndex(entries);
    const candidates = new Map<string, AreaCandidate>();

    applyDetectedAreaRules({ candidates, index });

    // No exclusion regex is applied anymore -- every build.gradle counts as a
    // signal, at any depth. What used to be a separate `android/plugin` owner
    // (or, before this fixture's depth, `android`/`android/app`) now walks up
    // through `resolveNearestMarkerOwner`, finds Flutter's own `pubspec.yaml`
    // at the repo root, and redirects there -- so Android's candidate lands
    // at the SAME owner as Flutter's, not its own separate one.
    // Reconciling same-owner candidates into one is `reconcileCandidates`,
    // which `buildDetectedAreas` runs after this call, so both survive as
    // distinct, unreconciled candidates here. That's the correct intermediate
    // state to assert, not a bug in this test.
    expect([...candidates.keys()].sort()).toEqual([
      'Mobile app::.::Android',
      'Mobile app::.::Flutter',
    ]);
  });

  it('redirects a deeply-nested bundled Xcode project to the Flutter root instead of its own wrapper directory', () => {
    const entries: RepoTreeEntry[] = [
      {
        path: 'pubspec.yaml',
        name: 'pubspec.yaml',
        type: 'file',
        depth: 0,
        parentPath: null,
        extension: 'yaml',
        sizeBytes: 220,
      },
      {
        path: '.metadata',
        name: '.metadata',
        type: 'file',
        depth: 0,
        parentPath: null,
        extension: null,
        sizeBytes: 140,
      },
      {
        path: 'lib',
        name: 'lib',
        type: 'directory',
        depth: 0,
        parentPath: null,
        extension: null,
        sizeBytes: null,
      },
      {
        path: 'lib/main.dart',
        name: 'main.dart',
        type: 'file',
        depth: 1,
        parentPath: 'lib',
        extension: 'dart',
        sizeBytes: 480,
      },
      {
        path: 'ios',
        name: 'ios',
        type: 'directory',
        depth: 0,
        parentPath: null,
        extension: null,
        sizeBytes: null,
      },
      {
        path: 'ios/Runner.xcodeproj',
        name: 'Runner.xcodeproj',
        type: 'directory',
        depth: 1,
        parentPath: 'ios',
        extension: null,
        sizeBytes: null,
      },
      {
        path: 'ios/sub',
        name: 'sub',
        type: 'directory',
        depth: 1,
        parentPath: 'ios',
        extension: null,
        sizeBytes: null,
      },
      {
        path: 'ios/sub/extra',
        name: 'extra',
        type: 'directory',
        depth: 2,
        parentPath: 'ios/sub',
        extension: null,
        sizeBytes: null,
      },
      {
        path: 'ios/sub/extra/Runner.xcodeproj',
        name: 'Runner.xcodeproj',
        type: 'directory',
        depth: 3,
        parentPath: 'ios/sub/extra',
        extension: null,
        sizeBytes: null,
      },
      {
        path: 'ios/sub/extra/AppDelegate.swift',
        name: 'AppDelegate.swift',
        type: 'file',
        depth: 3,
        parentPath: 'ios/sub/extra',
        extension: 'swift',
        sizeBytes: 260,
      },
    ];
    const index = buildEntryIndex(entries);
    const candidates = new Map<string, AreaCandidate>();

    applyDetectedAreaRules({ candidates, index });

    // No exclusion regex is applied anymore -- every .xcodeproj counts as a
    // signal, at any depth. What used to be a separate `ios/sub/extra` owner
    // now walks up through `resolveNearestMarkerOwner`, finds Flutter's own
    // `pubspec.yaml` at the repo root, and redirects there -- so iOS's
    // candidate lands at the SAME owner as Flutter's, not its own separate
    // one. Reconciling same-owner candidates into one is
    // `reconcileCandidates`, which `buildDetectedAreas` runs after this call,
    // so both survive as distinct, unreconciled candidates here. That's the
    // correct intermediate state to assert, not a bug in this test.
    expect([...candidates.keys()].sort()).toEqual([
      'Mobile app::.::Flutter',
      'Mobile app::.::iOS',
    ]);
  });

  it('redirects a native Android shell to a Flutter host whose marker is in a monorepo subdirectory', () => {
    const fileEntry = ({
      path,
      parentPath,
      extension,
    }: {
      path: string;
      parentPath: string;
      extension: string;
    }): RepoTreeEntry => ({
      path,
      name: path.split('/').pop() ?? path,
      type: 'file',
      depth: path.split('/').length - 1,
      parentPath,
      extension,
      sizeBytes: 200,
    });
    const entries: RepoTreeEntry[] = [
      fileEntry({
        path: 'apps/field/pubspec.yaml',
        parentPath: 'apps/field',
        extension: 'yaml',
      }),
      fileEntry({
        path: 'apps/field/android/plugin/build.gradle',
        parentPath: 'apps/field/android/plugin',
        extension: 'gradle',
      }),
      fileEntry({
        path: 'apps/field/android/plugin/src/main/AndroidManifest.xml',
        parentPath: 'apps/field/android/plugin/src/main',
        extension: 'xml',
      }),
    ];
    const index = buildEntryIndex(entries);
    const candidates = new Map<string, AreaCandidate>();

    applyDetectedAreaRules({ candidates, index });

    // The host marker sits at `apps/field/pubspec.yaml`, not at the repository
    // root, so this only redirects when markers are matched by basename.
    const keys = [...candidates.keys()];
    expect(keys).toContain('Mobile app::apps/field::Android');
    expect(keys).not.toContain('Mobile app::apps/field/android/plugin::Android');
  });
});

describe('Terraform infrastructure as code detector', () => {
  it('produces no area when Terraform only exists under demo and test folders', () => {
    const entries: RepoTreeEntry[] = [
      {
        path: 'examples/complete/main.tf',
        name: 'main.tf',
        type: 'file',
        depth: 2,
        parentPath: 'examples/complete',
        extension: 'tf',
        sizeBytes: 200,
      },
      {
        path: 'examples/simple/terraform.tfvars',
        name: 'terraform.tfvars',
        type: 'file',
        depth: 2,
        parentPath: 'examples/simple',
        extension: 'tfvars',
        sizeBytes: 200,
      },
      {
        path: 'examples/terragrunt/terragrunt.hcl',
        name: 'terragrunt.hcl',
        type: 'file',
        depth: 2,
        parentPath: 'examples/terragrunt',
        extension: 'hcl',
        sizeBytes: 200,
      },
      {
        path: 'test/fixtures/basic/main.tf',
        name: 'main.tf',
        type: 'file',
        depth: 3,
        parentPath: 'test/fixtures/basic',
        extension: 'tf',
        sizeBytes: 200,
      },
      {
        path: 'internal/testdata/dryrun/components/terraform/service/main.tf',
        name: 'main.tf',
        type: 'file',
        depth: 6,
        parentPath: 'internal/testdata/dryrun/components/terraform/service',
        extension: 'tf',
        sizeBytes: 200,
      },
      {
        path: 'spec/unit/infra/root/main.tf',
        name: 'main.tf',
        type: 'file',
        depth: 4,
        parentPath: 'spec/unit/infra/root',
        extension: 'tf',
        sizeBytes: 200,
      },
    ];
    const index = buildEntryIndex(entries);
    const candidates = new Map<string, AreaCandidate>();

    applyDetectedAreaRules({ candidates, index });

    expect([...candidates.keys()]).toEqual([]);
  });

  it('keeps a module repo as one area at the root and ignores its examples', () => {
    // The example is listed first: were it not dropped, it would be the first
    // path counted for the root owner and show up as its evidence.
    const entries: RepoTreeEntry[] = [
      {
        path: 'examples/complete/main.tf',
        name: 'main.tf',
        type: 'file',
        depth: 2,
        parentPath: 'examples/complete',
        extension: 'tf',
        sizeBytes: 200,
      },
      {
        path: 'main.tf',
        name: 'main.tf',
        type: 'file',
        depth: 0,
        parentPath: null,
        extension: 'tf',
        sizeBytes: 200,
      },
      {
        path: 'variables.tf',
        name: 'variables.tf',
        type: 'file',
        depth: 0,
        parentPath: null,
        extension: 'tf',
        sizeBytes: 200,
      },
      {
        path: 'outputs.tf',
        name: 'outputs.tf',
        type: 'file',
        depth: 0,
        parentPath: null,
        extension: 'tf',
        sizeBytes: 200,
      },
      {
        path: 'modules/flow-log/main.tf',
        name: 'main.tf',
        type: 'file',
        depth: 2,
        parentPath: 'modules/flow-log',
        extension: 'tf',
        sizeBytes: 200,
      },
      {
        path: 'wrappers/vpc-endpoints/main.tf',
        name: 'main.tf',
        type: 'file',
        depth: 2,
        parentPath: 'wrappers/vpc-endpoints',
        extension: 'tf',
        sizeBytes: 200,
      },
    ];
    const index = buildEntryIndex(entries);
    const candidates = new Map<string, AreaCandidate>();

    applyDetectedAreaRules({ candidates, index });

    const evidence = candidates.get(
      'Infrastructure as code::.::Terraform',
    )?.evidence;

    expect([...candidates.keys()]).toEqual([
      'Infrastructure as code::.::Terraform',
    ]);
    expect([...(evidence ?? [])]).toEqual(['main.tf']);
  });

  it('does not add a separate area for a test fixture next to real Terraform', () => {
    const entries: RepoTreeEntry[] = [
      {
        path: 'terraform/main.tf',
        name: 'main.tf',
        type: 'file',
        depth: 1,
        parentPath: 'terraform',
        extension: 'tf',
        sizeBytes: 200,
      },
      {
        path: 'test/fixtures/basic/main.tf',
        name: 'main.tf',
        type: 'file',
        depth: 3,
        parentPath: 'test/fixtures/basic',
        extension: 'tf',
        sizeBytes: 200,
      },
    ];
    const index = buildEntryIndex(entries);
    const candidates = new Map<string, AreaCandidate>();

    applyDetectedAreaRules({ candidates, index });

    expect([...candidates.keys()]).toEqual([
      'Infrastructure as code::terraform::Terraform',
    ]);
  });

  it('resolves a Terraform home folder as the owner of its environments and modules', () => {
    const entries: RepoTreeEntry[] = [
      {
        path: 'terraform/prod/main.tf',
        name: 'main.tf',
        type: 'file',
        depth: 2,
        parentPath: 'terraform/prod',
        extension: 'tf',
        sizeBytes: 200,
      },
      {
        path: 'terraform/stage/main.tf',
        name: 'main.tf',
        type: 'file',
        depth: 2,
        parentPath: 'terraform/stage',
        extension: 'tf',
        sizeBytes: 200,
      },
      {
        path: 'terraform/modules/vpc/main.tf',
        name: 'main.tf',
        type: 'file',
        depth: 3,
        parentPath: 'terraform/modules/vpc',
        extension: 'tf',
        sizeBytes: 200,
      },
      {
        path: 'terraform/prod/terraform.tfvars',
        name: 'terraform.tfvars',
        type: 'file',
        depth: 2,
        parentPath: 'terraform/prod',
        extension: 'tfvars',
        sizeBytes: 200,
      },
    ];
    const index = buildEntryIndex(entries);
    const candidates = new Map<string, AreaCandidate>();

    applyDetectedAreaRules({ candidates, index });

    expect([...candidates.keys()]).toEqual([
      'Infrastructure as code::terraform::Terraform',
    ]);
  });

  it('resolves a Terragrunt-only home folder to that folder', () => {
    const entries: RepoTreeEntry[] = [
      {
        path: 'terraform/root.hcl',
        name: 'root.hcl',
        type: 'file',
        depth: 1,
        parentPath: 'terraform',
        extension: 'hcl',
        sizeBytes: 200,
      },
      {
        path: 'terraform/live/prod/vpc/terragrunt.hcl',
        name: 'terragrunt.hcl',
        type: 'file',
        depth: 4,
        parentPath: 'terraform/live/prod/vpc',
        extension: 'hcl',
        sizeBytes: 200,
      },
    ];
    const index = buildEntryIndex(entries);
    const candidates = new Map<string, AreaCandidate>();

    applyDetectedAreaRules({ candidates, index });

    expect([...candidates.keys()]).toEqual([
      'Infrastructure as code::terraform::Terraform',
    ]);
  });

  it('keeps a workspace unit as the owner of its own Terraform', () => {
    const entries: RepoTreeEntry[] = [
      {
        path: 'apps/web/infra/main.tf',
        name: 'main.tf',
        type: 'file',
        depth: 3,
        parentPath: 'apps/web/infra',
        extension: 'tf',
        sizeBytes: 200,
      },
      {
        path: 'apps/web/infra/modules/db/main.tf',
        name: 'main.tf',
        type: 'file',
        depth: 5,
        parentPath: 'apps/web/infra/modules/db',
        extension: 'tf',
        sizeBytes: 200,
      },
    ];
    const index = buildEntryIndex(entries);
    const candidates = new Map<string, AreaCandidate>();

    applyDetectedAreaRules({ candidates, index });

    expect([...candidates.keys()]).toEqual([
      'Infrastructure as code::apps/web::Terraform',
    ]);
  });

  it('lets a root Terraform file own every nested Terraform folder', () => {
    const entries: RepoTreeEntry[] = [
      {
        path: 'main.tf',
        name: 'main.tf',
        type: 'file',
        depth: 0,
        parentPath: null,
        extension: 'tf',
        sizeBytes: 200,
      },
      {
        path: 'infra/main.tf',
        name: 'main.tf',
        type: 'file',
        depth: 1,
        parentPath: 'infra',
        extension: 'tf',
        sizeBytes: 200,
      },
      {
        path: 'apps/web/infra/main.tf',
        name: 'main.tf',
        type: 'file',
        depth: 3,
        parentPath: 'apps/web/infra',
        extension: 'tf',
        sizeBytes: 200,
      },
      {
        path: 'modules/vpc/main.tf',
        name: 'main.tf',
        type: 'file',
        depth: 2,
        parentPath: 'modules/vpc',
        extension: 'tf',
        sizeBytes: 200,
      },
    ];
    const index = buildEntryIndex(entries);
    const candidates = new Map<string, AreaCandidate>();

    applyDetectedAreaRules({ candidates, index });

    expect([...candidates.keys()]).toEqual([
      'Infrastructure as code::.::Terraform',
    ]);
  });
});

describe('Helm infrastructure as code detector', () => {
  /**
   * Builds a file tree entry from a repo-relative path. Only the path matters
   * to the Helm schemas; the other fields are derived to satisfy the type.
   */
  const file = (path: string): RepoTreeEntry => {
    const parts = path.split('/');
    const name = parts[parts.length - 1];
    return {
      path,
      name,
      type: 'file',
      depth: parts.length - 1,
      parentPath: parts.length > 1 ? parts.slice(0, -1).join('/') : null,
      extension: name.includes('.') ? (name.split('.').pop() ?? null) : null,
      sizeBytes: 200,
    };
  };

  const detect = (paths: string[]): Map<string, AreaCandidate> => {
    const candidates = new Map<string, AreaCandidate>();
    applyDetectedAreaRules({
      candidates,
      index: buildEntryIndex(paths.map(file)),
    });
    return candidates;
  };

  // Every case uses a root chart, so the owner is "." whatever owner adapter
  // is wired later; owner resolution has its own spec.
  it('emits Helm with related Kubernetes for a complete chart', () => {
    const candidates = detect([
      'Chart.yaml',
      'values.yaml',
      '.helmignore',
      'templates/deployment.yaml',
      'templates/_helpers.tpl',
    ]);

    expect([...candidates.keys()]).toEqual([
      'Infrastructure as code::.::Helm',
    ]);
    expect(candidates.get('Infrastructure as code::.::Helm')).toMatchObject({
      inferredTechnologies: {
        primary: 'Helm',
        related: new Set(['Kubernetes']),
      },
    });
  });

  it('scores each signal type once per owner', () => {
    const candidates = detect([
      'Chart.yaml',
      'values.yaml',
      '.helmignore',
      'Chart.lock',
      'templates/a.yaml',
      'templates/b.yaml',
      'templates/c.yaml',
    ]);

    // manifest 3 + templates 2 + values 1 + ignore 1 + lock 1, not 3 x 2.
    expect(candidates.get('Infrastructure as code::.::Helm')?.score).toBe(8);
  });

  it.each([
    ['values.yaml'],
    ['templates/deployment.yaml'],
    ['templates/_helpers.tpl'],
    ['.helmignore'],
    ['Chart.lock'],
  ])('lets the manifest plus %s alone open the gate', (companion) => {
    const candidates = detect(['Chart.yaml', companion]);

    expect([...candidates.keys()]).toEqual([
      'Infrastructure as code::.::Helm',
    ]);
  });

  it('does not emit for a Chart.yaml with no companion', () => {
    expect([...detect(['Chart.yaml']).keys()]).toEqual([]);
  });

  it('does not emit for companion files without a manifest', () => {
    // values.yaml and templates/ are common outside Helm (Ansible roles,
    // cookiecutter templates, helmfile value folders).
    const candidates = detect([
      'values.yaml',
      '.helmignore',
      'Chart.lock',
      'templates/deployment.yaml',
    ]);

    expect([...candidates.keys()]).toEqual([]);
  });

  it('does not treat a GitHub Actions workflow named chart.yaml as a manifest', () => {
    // kubernetes/ingress-nginx and pluralsh/bootstrap ship this file.
    const candidates = detect([
      '.github/workflows/chart.yaml',
      '.github/workflows/ci.yaml',
      'values.yaml',
    ]);

    expect([...candidates.keys()]).toEqual([]);
  });

  it('produces no area when charts only exist under demo and test folders', () => {
    // helm/helm and helmfile/helmfile shape: every chart is a test fixture.
    const candidates = detect([
      'pkg/chart/testdata/albatross/Chart.yaml',
      'pkg/chart/testdata/albatross/values.yaml',
      'pkg/chart/testdata/albatross/templates/svc.yaml',
      'examples/charts/paths-example/Chart.yaml',
      'examples/charts/paths-example/values.yaml',
      'test/e2e/testdata/charts/raw/Chart.yaml',
      'test/e2e/testdata/charts/raw/templates/raw.yaml',
      'tests/fixtures/chart/Chart.yaml',
      'tests/fixtures/chart/.helmignore',
      'spec/chart/Chart.yaml',
      'spec/chart/values.yaml',
    ]);

    expect([...candidates.keys()]).toEqual([]);
  });

  it('ignores demo and test files next to a real chart', () => {
    // The example is listed first: were it not dropped, its files would be the
    // first paths counted for the owner and show up as evidence.
    const candidates = detect([
      'examples/basic/Chart.yaml',
      'examples/basic/values.yaml',
      'Chart.yaml',
      'values.yaml',
      'templates/deployment.yaml',
      'tests/chart/Chart.lock',
    ]);

    const evidence = candidates.get('Infrastructure as code::.::Helm')
      ?.evidence;

    expect([...candidates.keys()]).toEqual([
      'Infrastructure as code::.::Helm',
    ]);
    expect([...(evidence ?? [])].sort()).toEqual([
      'Chart.yaml',
      'templates/deployment.yaml',
      'values.yaml',
    ]);
  });

  it('does not let a test fixture companion open the gate for a lone manifest', () => {
    // argoproj/argo-cd: `testdata2` is not on the demo/test list, so its
    // manifest is counted, and only a companion under a demo folder exists.
    const candidates = detect([
      'reposerver/repository/testdata2/out-of-bounds-chart/Chart.yaml',
      'examples/values.yaml',
    ]);

    expect([...candidates.keys()]).toEqual([]);
  });

  it('keeps a root chart and its subcharts as one area', () => {
    // Under the generic owner every path here is ".", the same owner a root
    // chart gets from any adapter.
    const candidates = detect([
      'Chart.yaml',
      'values.yaml',
      'templates/deployment.yaml',
      'charts/redis/Chart.yaml',
      'charts/redis/values.yaml',
      'charts/redis/templates/deployment.yaml',
    ]);

    expect([...candidates.keys()]).toEqual([
      'Infrastructure as code::.::Helm',
    ]);
  });

  it('keeps Terraform and Helm as separate candidates on the same owner', () => {
    // Candidates are keyed per primary technology and no META_PARENT_PAIRS row
    // covers infrastructure as code, so neither claim replaces the other.
    const candidates = detect([
      'main.tf',
      'variables.tf',
      'Chart.yaml',
      'values.yaml',
    ]);

    expect([...candidates.keys()].sort()).toEqual([
      'Infrastructure as code::.::Helm',
      'Infrastructure as code::.::Terraform',
    ]);
  });
});

describe('Ansible infrastructure as code detector', () => {
  /**
   * Builds a file tree entry from a repo-relative path. Only the path matters
   * to the Ansible schemas; the other fields are derived to satisfy the type.
   */
  const file = (path: string): RepoTreeEntry => {
    const parts = path.split('/');
    const name = parts[parts.length - 1];
    return {
      path,
      name,
      type: 'file',
      depth: parts.length - 1,
      parentPath: parts.length > 1 ? parts.slice(0, -1).join('/') : null,
      extension: name.includes('.') ? (name.split('.').pop() ?? null) : null,
      sizeBytes: 200,
    };
  };

  /**
   * Runs every detector over the paths and returns only the Ansible candidate
   * keys (`area::owner::Ansible`), so other detectors cannot affect a case.
   */
  const detectAnsible = (paths: string[]): string[] => {
    const candidates = new Map<string, AreaCandidate>();
    applyDetectedAreaRules({
      candidates,
      index: buildEntryIndex(paths.map(file)),
    });
    return [...candidates.keys()].filter((key) => key.endsWith('::Ansible'));
  };

  // These cases cover `deriveManifestDirectories` end to end: the derived
  // project directory is the owner. The resolver's own rules are in
  // `resolve-manifest-directory-owner.ansible.test.ts`.
  it.each([
    [
      'a standalone role is the repo root',
      ['tasks/main.yml', 'defaults/main.yml'],
      'Infrastructure as code::.::Ansible',
    ],
    [
      'a root galaxy.yml marks a collection at the repo root',
      ['galaxy.yml'],
      'Infrastructure as code::.::Ansible',
    ],
    [
      'group_vars under a root inventory folder belong to the repo root',
      ['inventory/group_vars/all.yml', 'site.yml'],
      'Infrastructure as code::.::Ansible',
    ],
    [
      'config, inventory environment and roles share the ansible folder',
      [
        'ansible/ansible.cfg',
        'ansible/inventory/prod/group_vars/all.yml',
        'ansible/roles/web/tasks/main.yml',
      ],
      'Infrastructure as code::ansible::Ansible',
    ],
    [
      'vendored roles fold into the project that holds them',
      [
        'infra/ansible/ansible.cfg',
        'infra/ansible/roles/common/tasks/main.yml',
        'infra/ansible/roles/geerlingguy.docker/tasks/main.yml',
      ],
      'Infrastructure as code::infra/ansible::Ansible',
    ],
    [
      'the original case of the folder is kept',
      ['Ansible/Roles/web/Tasks/main.yml'],
      'Infrastructure as code::Ansible::Ansible',
    ],
    [
      'a folder that merely contains "roles" is not a roles folder',
      ['my-roles/web/tasks/main.yml'],
      'Infrastructure as code::my-roles/web::Ansible',
    ],
  ])('%s', (_name, paths, expectedKey) => {
    expect(detectAnsible(paths)).toEqual([expectedKey]);
  });

  it.each([
    [
      'support signals alone never open the gate',
      ['.ansible-lint', 'molecule/default/molecule.yml', 'playbooks/site.yml'],
    ],
    [
      'a system-wide ansible.cfg under etc is not a project',
      ['etc/ansible/ansible.cfg'],
    ],
    [
      'the galaxy install metadata in a .info folder is not a collection root',
      [
        'collections/ansible_collections/community.crypto-3.2.1.info/GALAXY.yml',
      ],
    ],
    [
      'Ansible files that only exist under demo and test folders emit nothing',
      ['examples/ansible.cfg', 'tests/roles/web/tasks/main.yml'],
    ],
  ])('does not emit: %s', (_name, paths) => {
    expect(detectAnsible(paths)).toEqual([]);
  });
});
