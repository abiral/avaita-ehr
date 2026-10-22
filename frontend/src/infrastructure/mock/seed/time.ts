import { atLocal } from '@/domain/time'

export const KTM = 'Asia/Kathmandu'
/** Demo "now": Tuesday 20 October 2026, 14:20 in Kathmandu (the designs' today). */
export const DEMO_NOW = '2026-10-20T08:35:00.000Z'
/** ISO instant for a Kathmandu wall-clock time. */
export const k = (date: string, time: string): string => atLocal(date, time, KTM).toISOString()
