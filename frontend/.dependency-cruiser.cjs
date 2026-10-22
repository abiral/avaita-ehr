/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    { name: 'no-circular', severity: 'error', from: {}, to: { circular: true } },
    {
      name: 'domain-is-pure',
      severity: 'error',
      from: { path: '^src/(domain|core)/' },
      to: { path: '^src/(application|infrastructure|features|ui|app|i18n)/' },
    },
    {
      name: 'domain-no-frameworks',
      severity: 'error',
      from: { path: '^src/(domain|core)/' },
      to: { path: 'node_modules/(react|react-dom|react-router|@tanstack|zod|dompurify|msw)(/|$)' },
    },
    { name: 'core-no-packages', severity: 'error', from: { path: '^src/core/' }, to: { path: 'node_modules/' } },
    {
      name: 'application-no-outer-layers',
      severity: 'error',
      from: { path: '^src/application/' },
      to: {
        path: ['^src/(infrastructure|features|ui|app)/', 'node_modules/(react|react-dom|react-router|@tanstack)(/|$)'],
      },
    },
    {
      name: 'infrastructure-no-ui',
      severity: 'error',
      from: { path: '^src/infrastructure/' },
      to: { path: ['^src/(features|ui|app)/', 'node_modules/(react|react-dom|react-router)(/|$)'] },
    },
    {
      name: 'ui-is-domain-agnostic',
      severity: 'error',
      from: { path: '^src/ui/' },
      to: { path: '^src/(domain|application|infrastructure|features|app)/' },
    },
    {
      name: 'features-not-to-infrastructure',
      severity: 'error',
      from: { path: '^src/features/' },
      to: { path: '^src/infrastructure/' },
    },
    {
      name: 'features-only-via-index',
      severity: 'error',
      from: { path: '^src/features/([^/]+)/' },
      to: { path: '^src/features/', pathNot: ['^src/features/$1/', '^src/features/[^/]+/index\\.ts$'] },
    },
    {
      name: 'mock-only-from-app-and-tests',
      severity: 'error',
      from: { path: '^src/', pathNot: ['^src/app/', '^src/test/', '^src/infrastructure/mock/', '\\.test\\.tsx?$'] },
      to: { path: '^src/infrastructure/mock/' },
    },
  ],
  options: {
    tsConfig: { fileName: 'tsconfig.json' },
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '\\.(test|spec)\\.(ts|tsx)$|^src/test/' },
  },
}
