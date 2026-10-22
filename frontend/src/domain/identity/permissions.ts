export const PERMISSIONS = [
  'chart:read',
  'note:write',
  'note:sign',
  'order:write',
  'result:review',
  'result:release',
  'refill:decide',
  'schedule:read',
  'schedule:book-for-patient',
  'schedule:admin',
  'package:admin',
  'org:admin',
] as const
export type Permission = (typeof PERMISSIONS)[number]
