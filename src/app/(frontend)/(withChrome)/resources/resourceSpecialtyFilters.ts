import {
  type ResourceSpecialtyValue,
  specialtyLabel,
} from '@/constants/resourceSpecialtyLabels'
import type { AppLocale } from '@/utilities/localeShared'

export type ResourceListingFilterId = 'all' | ResourceSpecialtyValue

/** Order matches the reference filter bar (after “Show all”). */
const LISTING_ORDER: ResourceSpecialtyValue[] = [
  'orthopedic',
  'gastroenterology',
  'bariatric',
  'dermatology',
  'otolaryngology',
  'plastic_reconstructive',
]

export function getResourceListingSpecialtyFilters(locale: AppLocale): ReadonlyArray<{
  id: ResourceSpecialtyValue
  label: string
}> {
  return LISTING_ORDER.map((id) => ({ id, label: specialtyLabel(locale, id) }))
}
