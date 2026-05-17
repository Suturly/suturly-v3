export type ValueToTranslate = {
  onTranslate: (translatedValue: unknown) => void
  value: unknown
}

export type TranslateArgs = {
  collectionSlug?: string
  data?: Record<string, unknown>
  emptyOnly?: boolean
  globalSlug?: string
  id?: number | string
  locale: string
  localeFrom: string
  overrideAccess?: boolean
  update?: boolean
}

export type TranslateResult =
  | { success: false }
  | { success: true; translatedData: Record<string, unknown> }

export type TranslateOperationArgs =
  | ({ payload: import('payload').Payload } & TranslateArgs)
  | ({ req: import('payload').PayloadRequest } & TranslateArgs)
