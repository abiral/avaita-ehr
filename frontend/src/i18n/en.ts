import { admin } from './messages/admin'
import { auth } from './messages/auth'
import { clinical } from './messages/clinical'
import { common } from './messages/common'
import { portal } from './messages/portal'
import { shell } from './messages/shell'
import { staff } from './messages/staff'

export const en = { common, shell, auth, admin, portal, staff, clinical } as const

export type Messages = typeof en
