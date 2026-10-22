import { admin } from './messages/admin'
import { auth } from './messages/auth'
import { common } from './messages/common'
import { portal } from './messages/portal'
import { shell } from './messages/shell'
import { staff } from './messages/staff'

export const en = { common, shell, auth, admin, portal, staff } as const

export type Messages = typeof en
