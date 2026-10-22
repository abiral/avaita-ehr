import type { BookingRules } from '@/domain/scheduling/types'
import { t } from '@/i18n'
import { Card, CardHeader, Select } from '@/ui'
import styles from '../Availability.module.css'

type RuleKey = keyof BookingRules

const OPTIONS: Readonly<Record<RuleKey, readonly { value: number; label: () => string }[]>> = {
  maxDaysAhead: [60, 30, 90].map((n) => ({ value: n, label: () => t('admin.rules.windowOption', { n }) })),
  minNoticeMinutes: [
    { value: 120, label: () => t('admin.rules.noticeHours', { n: 2 }) },
    { value: 240, label: () => t('admin.rules.noticeHours', { n: 4 }) },
    { value: 1440, label: () => t('admin.rules.sameDay') },
  ],
  cancelCutoffMinutes: [240, 1440].map((m) => ({
    value: m,
    label: () => t('admin.rules.cancelOption', { n: m / 60 }),
  })),
  bufferMinutes: [
    { value: 0, label: () => t('admin.rules.none') },
    { value: 5, label: () => t('admin.rules.bufferOption', { n: 5 }) },
    { value: 10, label: () => t('admin.rules.bufferOption', { n: 10 }) },
  ],
}

const ROWS: readonly { key: RuleKey; label: 'window' | 'notice' | 'cancel' | 'buffer' }[] = [
  { key: 'maxDaysAhead', label: 'window' },
  { key: 'minNoticeMinutes', label: 'notice' },
  { key: 'cancelCutoffMinutes', label: 'cancel' },
  { key: 'bufferMinutes', label: 'buffer' },
]

/** A1: facility booking rules; each change saves right away. */
export function RulesCard({
  rules,
  onChange,
}: {
  readonly rules: BookingRules | undefined
  readonly onChange: (next: BookingRules) => void
}) {
  return (
    <Card as="section" labelledBy="rules">
      <CardHeader id="rules" title={t('admin.rules.title')} />
      {rules
        ? ROWS.map(({ key, label }) => (
            <div key={key} className={styles.rule}>
              <span className={styles.ruleText}>
                <span className={styles.ruleLabel}>{t(`admin.rules.${label}`)}</span>
                <span className={styles.ruleHint}>{t(`admin.rules.${label}Hint`)}</span>
              </span>
              <span className={styles.ruleSelect}>
                <Select
                  size="sm"
                  aria-label={t(`admin.rules.${label}`)}
                  value={String(rules[key])}
                  options={OPTIONS[key].map((o) => ({ value: String(o.value), label: o.label() }))}
                  onChange={(e) => onChange({ ...rules, [key]: Number(e.target.value) })}
                />
              </span>
            </div>
          ))
        : null}
    </Card>
  )
}
