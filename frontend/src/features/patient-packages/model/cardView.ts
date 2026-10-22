import type { Money } from '@/core/money'
import { validityParts, type ConsultationPackage, type PackageFormat } from '@/domain/packages'
import { formatMoney, t } from '@/i18n'

/** What a package card shows; A3 builds it from the editor form, P6 from the API. */
export interface PackageCardView {
  readonly name: string
  readonly doctor: string
  readonly category: string
  readonly formatLabel: string
  readonly description: string
  readonly items: readonly string[]
  readonly validity: string
  readonly price: string
}

export type CardSource = Pick<
  ConsultationPackage,
  'name' | 'practitionerName' | 'category' | 'format' | 'description' | 'items' | 'validityDays'
> & { readonly price: Money | null }

export const validityLabel = (days: number): string => {
  const { unit, count } = validityParts(days)
  return t(`portal.packages.validity.${unit}`, { count })
}

export const formatLabel = (format: PackageFormat): string => t(`portal.packages.cardFormat.${format}`)

export const priceLabel = (price: Money | null): string =>
  price ? formatMoney(price.minor, price.currency) : t('portal.packages.price')

export function toCardView(p: CardSource): PackageCardView {
  return {
    name: p.name,
    doctor: p.practitionerName,
    category: p.category,
    formatLabel: formatLabel(p.format),
    description: p.description,
    items: p.items.map((i) => i.label),
    validity: validityLabel(p.validityDays),
    price: priceLabel(p.price),
  }
}
