import type { BlockId } from '@/core/branded'
import { blockSlotCount, weeklySummary } from '@/domain/scheduling/blocks'
import { WEEKDAYS, type AvailabilityBlock, type Weekday } from '@/domain/scheduling/types'
import { t } from '@/i18n'
import { cx } from '@/shared/cx'
import { Button, Card, CardHeader, Icon, SkeletonRows, Tag } from '@/ui'
import styles from '../Availability.module.css'

export interface WeeklyTemplateProps {
  readonly doctorName: string
  readonly blocks: readonly AvailabilityBlock[]
  readonly loading: boolean
  readonly bufferMinutes: number
  readonly onAdd: (day: Weekday) => void
  readonly onRemove: (id: BlockId) => void
}

const day = (d: Weekday) => t(`admin.days.${d}`)

function BlockChip({
  block,
  buffer,
  onRemove,
}: {
  readonly block: AvailabilityBlock
  readonly buffer: number
  readonly onRemove: () => void
}) {
  const mode = t(`admin.modes.${block.mode}`)
  const meta = { mode, room: block.room ?? '', length: block.slotMinutes, count: blockSlotCount(block, buffer) }
  return (
    <div className={cx(styles.blk, block.mode === 'remote' && styles.remote)}>
      <span className={styles.blkText}>
        <span className={cx('mono', styles.blkTime)}>
          {t('admin.blocks.time', { start: block.start, end: block.end })}
        </span>
        <span className={styles.blkMeta}>
          {block.room ? t('admin.blocks.metaRoom', meta) : t('admin.blocks.meta', meta)}
          {block.repeat === 'once' ? ` · ${t('admin.blocks.once')}` : ''}
        </span>
      </span>
      <button
        type="button"
        className={styles.remove}
        aria-label={t('admin.blocks.remove', { day: day(block.weekday), start: block.start, end: block.end })}
        onClick={onRemove}
      >
        <Icon name="close" size={14} />
      </button>
    </div>
  )
}

/** A1: the weekly template per day, with slot counts per block. */
export function WeeklyTemplate({ doctorName, blocks, loading, bufferMinutes, onAdd, onRemove }: WeeklyTemplateProps) {
  const s = weeklySummary(blocks, bufferMinutes)
  const summary = t(s.both ? 'admin.blocks.summaryBoth' : 'admin.blocks.summary', {
    total: s.total,
    onsite: s.onsite,
    remote: s.remote,
    both: s.both,
  })
  return (
    <Card as="section" labelledBy="wk">
      <CardHeader
        id="wk"
        title={t('admin.blocks.template', { doctor: doctorName })}
        sub={summary}
        action={
          <span className={styles.legend} aria-label={t('admin.blocks.legend')}>
            <Tag>{t('admin.modes.onsite')}</Tag>
            <Tag tone="info">{t('admin.modes.remote')}</Tag>
          </span>
        }
      />
      {loading ? <SkeletonRows label={t('admin.blocks.loading')} rows={4} /> : null}
      {loading
        ? null
        : WEEKDAYS.map((d) => {
            const mine = blocks.filter((b) => b.weekday === d).sort((a, b) => a.start.localeCompare(b.start))
            return (
              <div key={d} className={styles.dayRow}>
                <span className={styles.dayName}>{day(d)}</span>
                <div className={styles.dayBlocks}>
                  {mine.map((b) => (
                    <BlockChip key={b.id} block={b} buffer={bufferMinutes} onRemove={() => onRemove(b.id)} />
                  ))}
                  {mine.length === 0 ? <span className={styles.none}>{t('admin.blocks.notBookable')}</span> : null}
                </div>
                <Button size="sm" aria-label={t('admin.blocks.addBlockFor', { day: day(d) })} onClick={() => onAdd(d)}>
                  {t('admin.blocks.addBlock')}
                </Button>
              </div>
            )
          })}
    </Card>
  )
}
