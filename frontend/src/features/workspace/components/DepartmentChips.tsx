import type { Department } from '@/domain/identity'
import { t } from '@/i18n'
import styles from '../Workspace.module.css'

export const departmentLabel = (d: Department): string =>
  d.unit ? `${d.name} · ${t('auth.workspace.ward', { unit: d.unit })}` : d.name

export interface DepartmentChipsProps {
  readonly departments: readonly Department[]
  readonly selectedId: string | null
  readonly onPick: (id: string) => void
}

export function DepartmentChips({ departments, selectedId, onPick }: DepartmentChipsProps) {
  return (
    <div className={styles.chips}>
      {departments.map((d) => (
        <button
          key={d.id}
          type="button"
          className={styles.chip}
          aria-pressed={d.id === selectedId}
          onClick={() => onPick(d.id)}
        >
          {departmentLabel(d)}
        </button>
      ))}
    </div>
  )
}
