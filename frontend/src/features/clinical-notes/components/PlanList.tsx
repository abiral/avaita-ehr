import { useState } from 'react'
import type { PlanItem } from '@/domain/clinical'
import { t } from '@/i18n'
import { Button, Tag, TextAction, TextField } from '@/ui'
import styles from '../Notes.module.css'
import { addPlanItem, removePlanItem } from '../model/noteForm'

export interface PlanListProps {
  readonly plan: readonly PlanItem[]
  readonly readOnly: boolean
  readonly onChange: (plan: readonly PlanItem[]) => void
}

/** Numbered plan; items already ordered show their order status. */
export function PlanList({ plan, readOnly, onChange }: PlanListProps) {
  const [text, setText] = useState('')
  return (
    <div className={styles.sec}>
      <span id="note-plan" className={styles.secLabel}>
        {t('clinical.note.plan')}
      </span>
      <ol className={styles.plan} aria-labelledby="note-plan">
        {plan.map((p, i) => (
          <li key={`${String(i)}-${p.text}`} className={styles.planItem}>
            <span>{p.text}</span>
            <span className={styles.planRight}>
              {p.orderStatus === 'none' ? null : (
                <Tag tone="info">{t(`clinical.note.orderStatus.${p.orderStatus}`)}</Tag>
              )}
              {readOnly ? null : (
                <TextAction
                  aria-label={t('clinical.note.removePlan', { item: p.text })}
                  onClick={() => onChange(removePlanItem(plan, i))}
                >
                  {t('clinical.orders.remove')}
                </TextAction>
              )}
            </span>
          </li>
        ))}
      </ol>
      {readOnly ? null : (
        <div className={styles.addPlan}>
          <span className={styles.addPlanField}>
            <TextField label={t('clinical.note.planItem')} value={text} onValue={setText} compact />
          </span>
          <Button
            size="sm"
            disabled={!text.trim()}
            onClick={() => {
              onChange(addPlanItem(plan, text))
              setText('')
            }}
          >
            {t('clinical.note.addPlan')}
          </Button>
        </div>
      )}
    </div>
  )
}
