import type { ReactNode } from 'react'
import styles from './Table.module.css'

export interface TableColumn<Row> {
  readonly key: string
  readonly header: ReactNode
  readonly cell: (row: Row) => ReactNode
  readonly align?: 'left' | 'right'
  readonly width?: string
}

export interface TableProps<Row> {
  readonly caption: string
  readonly columns: readonly TableColumn<Row>[]
  readonly rows: readonly Row[]
  readonly rowKey: (row: Row) => string
  readonly minWidth?: number
}

/** Semantic table that scrolls horizontally inside its card on small screens. */
export function Table<Row>({ caption, columns, rows, rowKey, minWidth = 640 }: TableProps<Row>) {
  return (
    <div className={styles.scroll}>
      <table className={styles.table} style={{ minWidth }}>
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" data-align={c.align} style={c.width ? { width: c.width } : undefined}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((c) => (
                <td key={c.key} data-align={c.align}>
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
