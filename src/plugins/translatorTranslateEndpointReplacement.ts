import type { Endpoint, Plugin } from 'payload'
import type { PayloadRequest } from 'payload'
import { APIError } from 'payload'

import { translateOperation } from '@/translators/contentTranslator/translateOperation'

/** Matches `@jhb.software/payload-content-translator-plugin` root POST route. */
export const TRANSLATOR_TRANSLATE_API_PATH = '/translator/translate'

export type TranslatorEndpointAccess = (args: {
  req: PayloadRequest
}) => boolean | Promise<boolean>

/**
 * The translator package always registers POST `/translator/translate` using its **bundled**
 * `translateOperation` (no inline blocks / embedded Lexical strings). We run **after** that plugin
 * and replace the route so any caller (including future UI if collections are enabled) uses our walk.
 */
export function createTranslatorTranslateEndpoint(access: TranslatorEndpointAccess): Endpoint {
  return {
    method: 'post',
    path: TRANSLATOR_TRANSLATE_API_PATH,
    handler: async (req) => {
      if (!(await access({ req }))) {
        throw new APIError('You must be logged in to translate content', 401)
      }

      let body: unknown
      try {
        body = await (req as Request).json()
      } catch {
        throw new APIError('Invalid JSON body', 400)
      }

      if (!body || typeof body !== 'object') {
        throw new APIError('JSON body required', 400)
      }

      const {
        id,
        collectionSlug,
        data,
        emptyOnly,
        globalSlug,
        locale,
        localeFrom,
      } = body as {
        id?: string | number
        collectionSlug?: string
        data?: Record<string, unknown>
        emptyOnly?: boolean
        globalSlug?: string
        locale?: string
        localeFrom?: string
      }

      if (!locale || !localeFrom) {
        throw new APIError('locale and localeFrom are required', 400)
      }

      const result = await translateOperation({
        id,
        collectionSlug,
        data,
        emptyOnly,
        globalSlug,
        locale,
        localeFrom,
        overrideAccess: false,
        req,
        update: false,
      })

      return Response.json(result)
    },
  }
}

export function translatorTranslateEndpointReplacementPlugin(
  access: TranslatorEndpointAccess,
): Plugin {
  const replacement = createTranslatorTranslateEndpoint(access)

  return (config) => ({
    ...config,
    endpoints: [
      ...(config.endpoints ?? []).filter((endpoint) => {
        const method = String(endpoint.method ?? 'get').toLowerCase()
        const path = typeof endpoint.path === 'string' ? endpoint.path : ''
        return !(method === 'post' && path === TRANSLATOR_TRANSLATE_API_PATH)
      }),
      replacement,
    ],
  })
}
