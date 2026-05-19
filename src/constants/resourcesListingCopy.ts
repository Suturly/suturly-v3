import type { AppLocale } from '@/utilities/localeShared'

export const resourcesListingCopy: Record<
  AppLocale,
  {
    metaTitle: string
    metaDescription: string
    heading: string
    showAll: string
    filterToolbarAria: string
  }
> = {
  en: {
    metaTitle: 'Resources',
    metaDescription: 'Explore practical resources and chapter guides.',
    heading: 'Explore available resources',
    showAll: 'Show all',
    filterToolbarAria: 'Filter resources by specialty',
  },
  es: {
    metaTitle: 'Recursos',
    metaDescription: 'Explore recursos prácticos y guías por capítulos.',
    heading: 'Explore los recursos disponibles',
    showAll: 'Mostrar todo',
    filterToolbarAria: 'Filtrar recursos por especialidad',
  },
}
