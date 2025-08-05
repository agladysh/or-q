import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['packages/*/src/**/*.{js,ts}'],
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: { projectService: true },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
      noInlineConfig: false,
    },
    rules: {
      // treat all warnings as errors
      'no-warning-comments': ['error', { terms: ['todo', 'fixme'] }],
    },
  }
);
