import nextPlugin from 'eslint-config-next';

const eslintConfig = [
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/out/**',
      '**/build/**',
      '**/dist/**',
      '**/.cache/**',
      '**/coverage/**',
      '**/next-env.d.ts',
      '**/.turbo/**',
      '**/public/**',
    ],
  },
  ...nextPlugin,
];

export default eslintConfig;
