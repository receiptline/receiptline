module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'airbnb',
    'airbnb-typescript/base',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.eslint.json'],
    sourceType: 'module',
    ecmaVersion: 2021,
  },
  plugins: ['@typescript-eslint', 'import', 'simple-import-sort'],
  rules: {
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'only-multiline'],
    'object-curly-spacing': ['error', 'always'],
    'quotes': ['error', 'single', {
      'avoidEscape': true,
      'allowTemplateLiterals': true
    }],
    'max-len': ['error', {
      'code': 200.,
      'comments': 200,
      'tabWidth': 2,
      'ignoreStrings': true,
    }],
    'indent': ['error', 2, { 'SwitchCase': 1 }],
    'linebreak-style': ['error', 'unix'],
    'quote-props': ['error', 'as-needed'],
    'sort-imports': 'off',
    'import/exports-last': 'error',
    'import/group-exports': 'error',
    'import/newline-after-import': ['error', { count: 1 }],
    'simple-import-sort/imports': [
      'error',
      {
        groups: [
          // testing packages / alias to the almost top
          ['^(@test|Test|test)', '^Src/test', 'jest', '^@?\\w'],
          // path alias
          ['^Src', '^@?\\w'],
          // relative imports.
          ['^\\.', '^@?\\w'],
          // Side effect imports:
          //  - does not have a from ( simple-import-sort/sort sorts by what comes after from )
          //  - https://github.com/lydell/eslint-plugin-simple-import-sort#why-sort-on-from
          //  - ie - import 'some-polyfill';
          ['^\\u0000', '^@?\\w'],
        ],
      },
    ],
    'simple-import-sort/exports': 'error',
    'no-undef': 'off', // Typescript should be catching this
    // START: turn off bc there be a lot
    'no-bitwise': 'off',
    'no-plusplus': 'off',
    'no-underscore-dangle': 'off',
    '@typescript-eslint/naming-convention': 'off',
    'no-mixed-operators': 'off',
    // END: turn off bc there be a lot
    '@typescript-eslint/no-unused-vars': ['error'],
    'no-console': [
      'warn',
      {
        allow: [
          'warn',
          'info',
          'dir',
          'timeLog',
          'assert',
          'clear',
          'count',
          'countReset',
          'group',
          'groupEnd',
          'table',
          'dirxml',
          'error',
          'groupCollapsed',
          'Console',
          'profile',
          'profileEnd',
          'timeStamp',
          'context',
        ],
      },
    ],
  },
};
