import type { CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'

import type { Post } from '@/payload-types'
import { mergeSpanishFromEnglishForPost } from '@/translators/mergeSpanishFromEnglish'
import {
  isPublishingActiveLocale,
  publishAllLocalesStatus,
} from '@/utilities/localePublishStatus'
import { requestIsAutosave } from '@/utilities/requestIsAutosave'

/**
 * When the document is fully linked (`spanishMirrorsEnglish !== false`) and the editor
 * publishes from English, mirror all localized fields into ES and publish both locales.
 */
export const linkedLocalePublish: CollectionBeforeChangeHook<Post> = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  if (requestIsAutosave(req)) return data

  const locale = req.locale
  if (locale === 'es' || locale === 'all') return data

  const linked =
    data.spanishMirrorsEnglish !== false && originalDoc?.spanishMirrorsEnglish !== false
  if (!linked) return data

  if (!isPublishingActiveLocale(data, locale)) return data

  if (operation === 'create') {
    data._status = publishAllLocalesStatus(data._status) as unknown as Post['_status']
    return data
  }

  const id = data.id ?? originalDoc?.id
  if (id === undefined || id === null) return data

  const ok = await mergeSpanishFromEnglishForPost(req, id, {
    draft: false,
    failOnError: true,
  })
  if (!ok) {
    throw new APIError('Failed to mirror English content to Spanish before publish.', 500)
  }

  data._status = publishAllLocalesStatus(data._status) as unknown as Post['_status']

  return data
}
