// Performance budget (section 15, F10): the first patient route, sign in, must stay under
// 200 KB gzipped, counting the entry, everything it imports, the sign-in screen chunk and CSS.
// Staff and admin screens must not be part of that set.
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { join } from 'node:path'

const BUDGET_KB = 200
const FIRST_ROUTE = 'src/features/auth/index.ts'
const STAFF_ONLY =
  /src\/features\/(ward|clinic-schedule|clinical-notes|lab-orders|results-review|medication-requests|patient-chart|admin-|organization)/

const dist = join(import.meta.dirname, '..', 'dist')
const manifest = JSON.parse(readFileSync(join(dist, '.vite', 'manifest.json'), 'utf8'))
const entryKey = Object.keys(manifest).find((k) => manifest[k].isEntry)
if (!entryKey) throw new Error('No entry in the build manifest. Run vite build first.')

const files = new Set()
const seen = new Set()
const walk = (key) => {
  if (seen.has(key)) return
  seen.add(key)
  const chunk = manifest[key]
  if (!chunk) return
  files.add(chunk.file)
  for (const css of chunk.css ?? []) files.add(css)
  for (const dep of chunk.imports ?? []) walk(dep)
}
walk(entryKey)
walk(FIRST_ROUTE)

const leaked = [...seen].filter((k) => STAFF_ONLY.test(k))
const gz = (file) => gzipSync(readFileSync(join(dist, file))).length
const total = [...files].reduce((sum, f) => sum + gz(f), 0)
const kb = total / 1024
console.log(
  `First patient route: ${kb.toFixed(1)} KB gzipped across ${String(files.size)} files (budget ${String(BUDGET_KB)} KB)`,
)
if (leaked.length > 0) {
  console.error(`Staff or admin code in the first route: ${leaked.join(', ')}`)
  process.exit(1)
}
if (kb > BUDGET_KB) {
  console.error('Over budget.')
  process.exit(1)
}
