import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results', 'public/mockServiceWorker.js'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { react, 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    settings: { react: { version: 'detect' } },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.strict.rules,
      'react/jsx-key': 'error',
      'react/no-danger': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-ignore': true, 'ts-expect-error': 'allow-with-description' },
      ],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      'no-restricted-exports': ['error', { restrictDefaultExports: { direct: true } }],
      'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 60, skipBlankLines: true, skipComments: true }],
      complexity: ['error', 10],
      'max-params': ['error', 4],
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
      eqeqeq: 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      'no-console': 'error',
    },
  },
  // Browser capabilities only inside adapters and the composition root (section 3)
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/infrastructure/**', 'src/app/**', 'src/test/**', '**/*.test.*'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'Use an adapter in src/infrastructure.' },
        { name: 'localStorage', message: 'No PHI in storage. Use the PreferenceStore port for UI prefs.' },
        { name: 'sessionStorage', message: 'No PHI in storage.' },
        { name: 'indexedDB', message: 'No PHI in storage.' },
        { name: 'EventSource', message: 'Use the RealtimeChannel port.' },
        { name: 'confirm', message: 'Use ConfirmDialog from src/ui.' },
        { name: 'alert', message: 'Use Banner or Modal from src/ui.' },
      ],
      'no-restricted-properties': [
        'error',
        { object: 'window', property: 'print', message: 'Use the Printer port.' },
        { object: 'Date', property: 'now', message: 'Inject Clock.' },
        { object: 'document', property: 'cookie', message: 'Cookies are set by the backend only.' },
      ],
    },
  },
  // Pure layers: no ambient time, no DOM, no network
  {
    files: ['src/domain/**/*.ts', 'src/application/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        { selector: "NewExpression[callee.name='Date'][arguments.length=0]", message: 'Inject Clock.' },
      ],
      'no-restricted-globals': [
        'error',
        'document',
        'window',
        'localStorage',
        'sessionStorage',
        'fetch',
        'navigator',
        'EventSource',
      ],
    },
  },
  // Query keys must come from scopedKeys (section 4)
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "Property[key.name='queryKey'] > ArrayExpression",
          message: 'Use scopedKeys(scope) so every key carries the facility.',
        },
      ],
    },
  },
  { files: ['src/ui/SafeHtml.tsx'], rules: { 'react/no-danger': 'off' } },
  // The mock server is dev and test infrastructure only (never in the production bundle): size rules relaxed
  {
    files: ['src/infrastructure/mock/**', 'src/infrastructure/api/contract/**'],
    rules: {
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': 'off',
      complexity: 'off',
      'max-params': 'off',
    },
  },
  // Data files: message catalogs and mock seed data are long by nature
  {
    files: ['src/i18n/messages/**', 'src/infrastructure/mock/seed/**'],
    rules: { 'max-lines': 'off', 'max-params': 'off' },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'src/test/**', 'e2e/**'],
    rules: {
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      complexity: 'off',
      'max-params': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
    },
  },
  {
    files: ['*.config.{js,ts}', '.dependency-cruiser.cjs', 'eslint.config.js', 'scripts/**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: { ...tseslint.configs.disableTypeChecked.languageOptions, globals: globals.node },
    rules: { ...tseslint.configs.disableTypeChecked.rules, 'no-restricted-exports': 'off' },
  },
)
