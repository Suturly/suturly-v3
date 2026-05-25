import type { CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'

import type { Post } from '@/payload-types'
import { mergeSpanishFromEnglishForPost } from '@/translators/mergeSpanishFromEnglish'
import { isPublishingActiveLocale } from '@/utilities/localePublishStatus'
import { requestIsAutosave } from '@/utilities/requestIsAutosave'

import { LINKED_LOCALE_PUBLISH_CONTEXT } from './finalizeLinkedLocalePublish'

/**
 * When the document is fully linked (`spanishMirrorsEnglish !== false`) and the editor
 * publishes from English, mirror localized fields into ES before save and flag afterChange
 * to run `publishAllLocales` (see {@link finalizeLinkedLocalePublish}).
 */
export const linkedLocalePublish: CollectionBeforeChangeHook<Post> = async ({
  data,
  req,
  operation,
  originalDoc,
  context,
}) => {
  if (requestIsAutosave(req)) return data

  const locale = req.locale
  if (locale === 'es' || locale === 'all') return data

  const linked =
    data.spanishMirrorsEnglish !== false && originalDoc?.spanishMirrorsEnglish !== false
  if (!linked) return data

  if (!isPublishingActiveLocale(data, locale)) return data

  context[LINKED_LOCALE_PUBLISH_CONTEXT] = true

  if (operation === 'create') {
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

  return data
}
