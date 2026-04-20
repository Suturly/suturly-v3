/** Values must match `specialties` options on the Resources (`posts`) collection. */
export type ResourceSpecialtyValue =
  | 'plastic_reconstructive'
  | 'orthopedic'
  | 'gastroenterology'
  | 'bariatric'
  | 'dermatology'
  | 'otolaryngology'

export type ResourceListingFilterId = 'all' | ResourceSpecialtyValue

/** Order matches the reference filter bar (after “Show all”). */
export const RESOURCE_LISTING_SPECIALTY_FILTERS: ReadonlyArray<{
  id: ResourceSpecialtyValue
  label: string
}> = [
  { id: 'orthopedic', label: 'Orthopedic Surgery' },
  { id: 'gastroenterology', label: 'Gastroenterology (GI)' },
  { id: 'bariatric', label: 'Bariatric Surgery' },
  { id: 'dermatology', label: 'Dermatology' },
  { id: 'otolaryngology', label: 'Otolaryngology (ENT)' },
  { id: 'plastic_reconstructive', label: 'Plastic & Reconstructive Surgery' },
]
