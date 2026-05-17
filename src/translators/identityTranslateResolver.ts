import type { TranslateResolver } from '@jhb.software/payload-content-translator-plugin'

/**
 * Copies EN strings into ES via `translateOperation` + shared {@link traverseFields} walker.
 * without calling DeepL (identity pass).
 */
export const identityTranslateResolver: TranslateResolver = {
  key: 'identity-en-to-es',
  resolve: async ({ texts }) => ({
    success: true,
    translatedTexts: texts.map((t) => (t == null ? '' : String(t))),
  }),
}
