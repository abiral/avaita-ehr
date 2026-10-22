import { axe } from 'vitest-axe'

/** Runs axe on a rendered container and fails with the rule ids that were violated. */
export async function expectNoA11yViolations(container: Element): Promise<void> {
  const results = await axe(container, { rules: { region: { enabled: false } } })
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(' | ')}`)).toEqual([])
}
