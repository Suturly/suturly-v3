/**
 * Adapted from @jhb.software/payload-content-translator-plugin (MIT) v0.2.0.
 */
import type { Payload, PayloadRequest } from 'payload'
import { APIError } from 'payload'

export function updateEntity(args: {
  collectionSlug?: string
  data: Record<string, unknown>
  depth?: number
  globalSlug?: string
  id?: number | string
  locale?: string | null
  overrideAccess?: boolean
  req: PayloadRequest
}): Promise<unknown> {
  const {
    id,
    collectionSlug,
    data,
    depth: incomingDepth,
    globalSlug,
    locale,
    overrideAccess,
    req,
  } = args

  if (!collectionSlug && !globalSlug) {
    throw new APIError('Bad Request', 400)
  }

  const isGlobal = !!globalSlug

  if (!isGlobal && !id && id !== 0) {
    throw new APIError('Bad Request', 400)
  }

  const depth = incomingDepth ?? req.payload.config.defaultDepth

  const promise = isGlobal
    ? req.payload.updateGlobal({
        slug: globalSlug!,
        data,
        depth,
        locale: locale ?? undefined,
        overrideAccess,
        req,
      } as Parameters<Payload['updateGlobal']>[0])
    : req.payload.update({
        id: id!,
        collection: collectionSlug!,
        data,
        depth,
        locale: locale ?? undefined,
        overrideAccess,
        req,
      } as Parameters<Payload['update']>[0])

  return promise
}
