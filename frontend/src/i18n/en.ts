import { common } from './messages/common'
import { shell } from './messages/shell'

export const en = { common, shell } as const

export type Messages = typeof en
