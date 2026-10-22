import type { VisitMode } from '@/domain/scheduling/types'
import { t } from '@/i18n'
import type { IconName } from '@/ui'

export interface VisitModeConfig {
  readonly icon: IconName
  readonly name: () => string
  readonly description: (location: string, facility: string) => string
  readonly meta: () => string
  readonly fee: () => string
  readonly tag: () => string
}

/** Strategy table for P5 and P6: label, icon, instructions and fee per visit mode. */
export const visitModes: Readonly<Record<VisitMode, VisitModeConfig>> = {
  onsite: {
    icon: 'hospital',
    name: () => t('portal.modes.onsite.name'),
    description: (location, facility) => t('portal.modes.onsite.desc', { location, facility }),
    meta: () => t('portal.modes.onsite.meta', { fee: t('portal.modes.onsite.fee') }),
    fee: () => t('portal.modes.onsite.fee'),
    tag: () => t('portal.modes.onsite.tag'),
  },
  remote: {
    icon: 'video',
    name: () => t('portal.modes.remote.name'),
    description: () => t('portal.modes.remote.desc'),
    meta: () => t('portal.modes.remote.meta', { fee: t('portal.modes.remote.fee') }),
    fee: () => t('portal.modes.remote.fee'),
    tag: () => t('portal.modes.remote.tag'),
  },
}
