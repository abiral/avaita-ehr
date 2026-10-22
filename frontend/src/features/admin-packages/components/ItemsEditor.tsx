import { useState } from 'react'
import type { PackageItem } from '@/domain/packages'
import { t } from '@/i18n'
import { Button, Select, TextAction } from '@/ui'
import styles from '../AdminPackages.module.css'
import { PRESETS, presetItem, type PresetKey } from '../model/packageForm'

export interface ItemsEditorProps {
  readonly items: readonly PackageItem[]
  readonly error?: string | undefined
  readonly onChange: (items: readonly PackageItem[]) => void
}

const isPreset = (v: string): v is PresetKey => PRESETS.some((p) => p.key === v)

/** "What is included": remove an item, or add one from the preset list. */
export function ItemsEditor({ items, error, onChange }: ItemsEditorProps) {
  const [preset, setPreset] = useState<PresetKey>('consultation')
  return (
    <div className={styles.group} role="group" aria-labelledby="pkg-items">
      <span id="pkg-items" className={styles.groupLabel}>
        {t('admin.packages.included')}
      </span>
      <ul className={styles.items}>
        {items.map((item, i) => (
          <li key={`${String(i)}-${item.label}`} className={styles.item}>
            <span>{item.label}</span>
            <TextAction
              aria-label={t('admin.packages.removeItem', { item: item.label })}
              onClick={() => onChange(items.filter((_, j) => j !== i))}
            >
              {t('admin.packages.remove')}
            </TextAction>
          </li>
        ))}
      </ul>
      {error ? <span className={styles.noticeError}>{error}</span> : null}
      <div className={styles.addRow}>
        <span className={styles.addSelect}>
          <Select
            aria-label={t('admin.packages.itemToAdd')}
            value={preset}
            size="sm"
            onChange={(e) => {
              if (isPreset(e.target.value)) setPreset(e.target.value)
            }}
            options={PRESETS.map((p) => ({ value: p.key, label: t(`admin.packages.presets.${p.key}`) }))}
          />
        </span>
        <Button size="sm" onClick={() => onChange([...items, presetItem(preset)])}>
          {t('admin.packages.addItem')}
        </Button>
      </div>
    </div>
  )
}
