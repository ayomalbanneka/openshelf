import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    rules: {
      'semi':            ['error', 'always'],
      'no-unused-vars':  ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'no-undef':        'error',
      'prefer-const':    'warn',
    },
    languageOptions: {
      ecmaVersion:  2022,
      sourceType:   'module',
      globals: {
        process:       'readonly',
        console:       'readonly',
        Buffer:        'readonly',
        setTimeout:    'readonly',
        setInterval:   'readonly',
        clearInterval: 'readonly',
        URL:           'readonly',
        fetch:         'readonly',
      },
    },
  },
];
