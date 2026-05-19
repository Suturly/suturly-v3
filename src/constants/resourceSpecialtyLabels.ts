import type { AppLocale } from '@/utilities/localeShared'

/** Values must match `specialties` on Resources (`posts`). Display labels only — stored values stay English slugs. */
export type ResourceSpecialtyValue =
  | 'plastic_reconstructive'
  | 'orthopedic'
  | 'gastroenterology'
  | 'bariatric'
  | 'dermatology'
  | 'otolaryngology'

export const RESOURCE_SPECIALTY_LABELS: Record<
  ResourceSpecialtyValue,
  Readonly<{ en: string; es: string }>
> = {
  plastic_reconstructive: {
    en: 'Plastic & Reconstructive Surgery',
    es: 'Cirugía plástica y reconstructiva',
  },
  orthopedic: {
    en: 'Orthopedic Surgery',
    es: 'Cirugía ortopédica',
  },
  gastroenterology: {
    en: 'Gastroenterology (GI)',
    es: 'Gastroenterología (digestivo)',
  },
  bariatric: {
    en: 'Bariatric Surgery',
    es: 'Cirugía bariátrica',
  },
  dermatology: {
    en: 'Dermatology',
    es: 'Dermatología',
  },
  otolaryngology: {
    en: 'Otolaryngology (ENT)',
    es: 'Otorrinolaringología (ORL)',
  },
}

/** Admin-friendly single label: English — español */
export function bilingualSpecialtyOptionLabel(value: ResourceSpecialtyValue): string {
  const row = RESOURCE_SPECIALTY_LABELS[value]
  return `${row.en} — ${row.es}`
}

export function specialtyLabel(locale: AppLocale, value: ResourceSpecialtyValue): string {
  const row = RESOURCE_SPECIALTY_LABELS[value]
  return locale === 'es' ? row.es : row.en
}
