/**
 * Adapted from @jhb.software/payload-content-translator-plugin (MIT) v0.2.0.
 */
import type { Field, Payload, PayloadRequest } from 'payload'
import { APIError } from 'payload'

function findConfigBySlug<T extends { slug?: string }>(
  slug: string,
  entities: T[],
): T | undefined {
  return entities.find((entity) => entity.slug === slug)
}

export async function findEntityWithConfig(args: {
  collectionSlug?: string
  globalSlug?: string
  draft?: boolean
  id?: number | string
  locale?: string | null
  overrideAccess?: boolean
  req: PayloadRequest
}): Promise<{ config: { fields: Field[] }; doc: Record<string, unknown> }> {
  const { id, collectionSlug, globalSlug, locale, overrideAccess, req, draft = true } = args

  if (!collectionSlug && !globalSlug) {
    throw new APIError('Bad Request', 400)
  }

  const { payload } = req
  const { config } = payload
  const isGlobal = !!globalSlug

  if (!isGlobal && !id && id !== 0) {
    throw new APIError('Bad Request', 400)
  }

  const entityConfig = isGlobal
    ? findConfigBySlug(globalSlug, config.globals)
    : findConfigBySlug(collectionSlug!, config.collections)

  if (!entityConfig) {
    throw new APIError('Bad Request', 400)
  }

  const docPromise = isGlobal
    ? payload.findGlobal({
        slug: globalSlug!,
        depth: 0,
        draft,
        locale: locale ?? undefined,
        overrideAccess,
        req,
      } as Parameters<Payload['findGlobal']>[0])
    : payload.findByID({
        id: id!,
        collection: collectionSlug!,
        depth: 0,
        draft,
        locale: locale ?? undefined,
        overrideAccess,
        req,
      } as Parameters<Payload['findByID']>[0])

  const doc = await docPromise

  return {
    config: entityConfig as { fields: Field[] },
    doc: doc as unknown as Record<string, unknown>,
  }
}
