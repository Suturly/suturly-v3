/**
 * Adapted from @jhb.software/payload-content-translator-plugin (MIT) v0.2.0.
 * Uses local traverseFields so Lexical inline blocks and root blocks resolve correctly.
 */
import type { TranslateResolver } from '@jhb.software/payload-content-translator-plugin'
import he from 'he'
import type { Payload, PayloadRequest } from 'payload'
import { APIError } from 'payload'

import { findEntityWithConfig } from './findEntityWithConfig'
import type { TranslateOperationArgs, TranslateResult, ValueToTranslate } from './types'
import { traverseFields } from './traverseFields'
import { updateEntity } from './updateEntity'

export async function translateOperation(args: TranslateOperationArgs): Promise<TranslateResult> {
  const req: PayloadRequest =
    'req' in args && args.req
      ? args.req
      : ({
          payload: (args as Extract<TranslateOperationArgs, { payload: Payload }>).payload,
        } as PayloadRequest)

  const { id, collectionSlug, globalSlug, locale, localeFrom, overrideAccess } = args

  const { config, doc: dataFrom } = await findEntityWithConfig({
    id,
    collectionSlug,
    globalSlug,
    locale: localeFrom,
    req,
  })

  const resolver = req.payload.config.custom?.translator?.resolver as TranslateResolver | undefined

  if (!resolver) {
    throw new APIError('No translation resolver configured')
  }

  const valuesToTranslate: ValueToTranslate[] = []
  let translatedData = args.data

  if (!translatedData) {
    const { doc } = await findEntityWithConfig({
      id,
      collectionSlug,
      globalSlug,
      locale,
      overrideAccess,
      req,
    })
    translatedData = doc
  }

  traverseFields({
    dataFrom,
    emptyOnly: args.emptyOnly ?? false,
    fields: config.fields,
    payloadConfig: req.payload.config,
    translatedData,
    valuesToTranslate,
  })

  const resolveResult = await resolver.resolve({
    localeFrom: args.localeFrom,
    localeTo: args.locale,
    req,
    texts: valuesToTranslate.map((each) => (each.value == null ? '' : String(each.value))),
  })

  let result: TranslateResult

  if (!resolveResult.success) {
    result = { success: false }
  } else {
    resolveResult.translatedTexts.forEach((translated, index) => {
      const formattedValue = he.decode(translated)
      valuesToTranslate[index].onTranslate(formattedValue)
    })

    if (args.update) {
      await updateEntity({
        id,
        collectionSlug,
        data: translatedData,
        depth: 0,
        globalSlug,
        locale,
        overrideAccess,
        req,
      })
    }

    result = {
      success: true,
      translatedData,
    }
  }

  return result
}
