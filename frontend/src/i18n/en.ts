import { admin } from './messages/admin'
import { auth } from './messages/auth'
import { common } from './messages/common'
import { shell } from './messages/shell'

export const en = { common, shell, auth, admin } as const

export type Messages = typeof en
