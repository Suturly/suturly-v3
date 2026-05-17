import type {
  TranslateResolver,
  TranslateResolverArgs,
  TranslateResolverResponse,
} from '@jhb.software/payload-content-translator-plugin'

/**
 * DeepL TranslateResolver for the payload-content-translator-plugin.
 *
 * Why DeepL (not the plugin's default OpenAI):
 *   - Per-request cost is significantly lower for short marketing/clinical strings.
 *   - HTML tag handling is built-in (Lexical richText is serialized to HTML by the
 *     plugin's traverseRichText, so DeepL preserves inline formatting we care about).
 *   - Free tier (api-free.deepl.com) gives 500k chars/month — plenty for editorial
 *     workflows; we auto-route to the Free or Pro host based on the API key suffix.
 *
 * The plugin's resolver contract returns either { success: false } or
 * { success: true, translatedTexts: string[] } where translatedTexts.length must
 * equal texts.length. Any failure path returns { success: false } so the plugin
 * surfaces a toast to the editor instead of corrupting form state with partial
 * translations.
 */

interface DeeplResolverConfig {
  apiKey: string
  /**
   * DeepL endpoint URL. Defaults to the Free API host when the key ends with `:fx`
   * (DeepL's free-tier marker) and the Pro host otherwise. Override only if you're
   * proxying through a custom domain.
   */
  endpoint?: string
  /**
   * Max texts per HTTP request. DeepL's hard limit is 50 strings or ~130KB per call;
   * we batch under that to avoid 413/414 errors on long richText fragments.
   * @default 50
   */
  chunkLength?: number
}

const DEEPL_FREE_ENDPOINT = 'https://api-free.deepl.com/v2/translate'
const DEEPL_PRO_ENDPOINT = 'https://api.deepl.com/v2/translate'

const chunkArray = <T>(arr: T[], size: number): T[][] => {
  if (size <= 0) return [arr]
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

/**
 * DeepL maps `EN`/`ES` directly. We force the source/target codes to upper-case
 * because DeepL rejects lower-case (the plugin and Payload pass them lower-cased
 * via the locale config).
 *
 * If you later need to disambiguate (e.g. ES-419 for Latin-American Spanish vs
 * ES for European Spanish), wire that here. For now we keep the single canonical
 * `ES` to match the project's locale config.
 */
const normalizeLangCode = (code: string): string => code.toUpperCase()

export const deeplResolver = ({
  apiKey,
  endpoint,
  chunkLength = 50,
}: DeeplResolverConfig): TranslateResolver => {
  const resolvedEndpoint =
    endpoint ?? (apiKey.endsWith(':fx') ? DEEPL_FREE_ENDPOINT : DEEPL_PRO_ENDPOINT)

  return {
    key: 'deepl',
    resolve: async ({
      localeFrom,
      localeTo,
      req,
      texts,
    }: TranslateResolverArgs): Promise<TranslateResolverResponse> => {
      if (texts.length === 0) {
        return { success: true, translatedTexts: [] }
      }

      const sourceLang = normalizeLangCode(localeFrom)
      const targetLang = normalizeLangCode(localeTo)

      try {
        const chunks = chunkArray(texts, chunkLength)
        const translatedTexts: string[] = []

        for (const chunk of chunks) {
          const body = new URLSearchParams()
          for (const text of chunk) body.append('text', text)
          body.set('source_lang', sourceLang)
          body.set('target_lang', targetLang)
          // tag_handling=html lets DeepL preserve inline HTML coming from
          // the plugin's richText -> HTML serializer (e.g. <strong>, <em>,
          // <a href="...">). Without this, DeepL would treat angle brackets
          // as literals and break formatting.
          body.set('tag_handling', 'html')
          body.set('preserve_formatting', '1')

          const response = await fetch(resolvedEndpoint, {
            method: 'POST',
            headers: {
              Authorization: `DeepL-Auth-Key ${apiKey}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
          })

          if (!response.ok) {
            const errBody = await response.text().catch(() => '<unreadable>')
            req.payload.logger.error({
              msg: 'deeplResolver: request failed',
              status: response.status,
              statusText: response.statusText,
              endpoint: resolvedEndpoint,
              errBodyPreview: errBody.slice(0, 500),
              chunkSize: chunk.length,
            })
            return { success: false }
          }

          const data = (await response.json().catch(() => null)) as {
            translations?: Array<{ text: string; detected_source_language?: string }>
          } | null

          if (!data || !Array.isArray(data.translations)) {
            req.payload.logger.error({
              msg: 'deeplResolver: unexpected response shape',
              endpoint: resolvedEndpoint,
              data,
            })
            return { success: false }
          }

          if (data.translations.length !== chunk.length) {
            req.payload.logger.error({
              msg: 'deeplResolver: chunk count mismatch',
              expected: chunk.length,
              received: data.translations.length,
            })
            return { success: false }
          }

          for (const t of data.translations) translatedTexts.push(t.text)
        }

        return { success: true, translatedTexts }
      } catch (err) {
        req.payload.logger.error({
          msg: 'deeplResolver: translation call threw',
          err: err instanceof Error ? err.message : String(err),
        })
        return { success: false }
      }
    },
  }
}
