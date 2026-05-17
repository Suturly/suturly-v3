/**
 * Adapted from @jhb.software/payload-content-translator-plugin (MIT) v0.2.0.
 *
 * Changes:
 * - Lexical nodes with `type: 'inlineBlock'` are handled like root `block` nodes (Payload inline blocks).
 * - `translateLexicalEmbeddedStrings`: strings inside Lexical JSON blocks are translated even when nested
 *   fields omit `localized: true`. Arrays/blocks Payload-ID remap still keys only off real localization
 *   (`field.localized || localizedParent`), so Timeline chips/items IDs stay stable.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- Porting upstream JS traversal against Payload field unions */
import ObjectIDModule from 'bson-objectid'
import type { Block, Field, SanitizedConfig } from 'payload'
import { tabHasName } from 'payload/shared'

import { isEmpty } from './isEmpty'
import type { ValueToTranslate } from './types'

const ObjectID =
  typeof ObjectIDModule === 'function'
    ? ObjectIDModule
    : (ObjectIDModule as { default: typeof ObjectIDModule }).default

function findBlockConfigBySlug(slug: string, payloadConfig: SanitizedConfig): Block | undefined {
  const payloadBlockConfig = payloadConfig.blocks?.find((block) => block.slug === slug)
  if (payloadBlockConfig) {
    return payloadBlockConfig
  }
  console.warn(
    `Could not find block config for lexical block with slug ${slug} in the Payload config blocks array. ` +
      'Register blocks on buildConfig({ blocks }) — see src/blocks/lexicalBlocksForConfig.ts.',
  )
  return undefined
}

function traverseRichText({
  emptyOnly,
  onText,
  payloadConfig,
  root,
  siblingData: initialSibling,
  translatedData,
  translateLexicalEmbeddedStrings,
  valuesToTranslate,
}: {
  emptyOnly: boolean
  onText: (siblingData: Record<string, unknown>, key: string) => void
  payloadConfig: SanitizedConfig
  root: Record<string, unknown>
  siblingData?: Record<string, unknown>
  translatedData: Record<string, unknown>
  translateLexicalEmbeddedStrings: boolean
  valuesToTranslate: ValueToTranslate[]
}): void {
  const siblingData = (initialSibling ?? root) as Record<string, unknown>

  if (typeof siblingData.text === 'string' && siblingData.text) {
    onText(siblingData, 'text')
  }

  const nodeType = siblingData.type

  if (nodeType === 'block' || nodeType === 'inlineBlock') {
    const fields = siblingData.fields as Record<string, unknown> | undefined
    if (
      fields &&
      typeof fields === 'object' &&
      typeof fields.blockType === 'string' &&
      fields.blockType
    ) {
      const blockData = fields
      const blockName = fields.blockType as string
      const blockConfig = findBlockConfigBySlug(blockName, payloadConfig)
      if (blockConfig) {
        traverseFields({
          dataFrom: root,
          emptyOnly,
          fields: blockConfig.fields as Field[],
          localizedParent: false,
          payloadConfig,
          siblingDataFrom: blockData,
          siblingDataTranslated: blockData,
          translatedData,
          translateLexicalEmbeddedStrings,
          valuesToTranslate,
        })
      }
    } else {
      console.warn('Could not find fields and blockType in block', siblingData)
    }
  } else if (Array.isArray(siblingData.children)) {
    for (const child of siblingData.children as unknown[]) {
      if (child && typeof child === 'object') {
        traverseRichText({
          emptyOnly,
          onText,
          payloadConfig,
          root,
          siblingData: child as Record<string, unknown>,
          translatedData,
          translateLexicalEmbeddedStrings,
          valuesToTranslate,
        })
      }
    }
  }
}

export function traverseFields({
  dataFrom,
  emptyOnly,
  fields,
  localizedParent,
  payloadConfig,
  siblingDataFrom: initialFrom,
  siblingDataTranslated: initialTranslated,
  translatedData,
  translateLexicalEmbeddedStrings,
  valuesToTranslate,
}: {
  dataFrom: Record<string, unknown>
  emptyOnly: boolean
  fields: Field[]
  localizedParent?: boolean
  payloadConfig: SanitizedConfig
  siblingDataFrom?: Record<string, unknown>
  siblingDataTranslated?: Record<string, unknown>
  translatedData: Record<string, unknown>
  translateLexicalEmbeddedStrings?: boolean
  valuesToTranslate: ValueToTranslate[]
}): void {
  const siblingDataFrom = initialFrom ?? dataFrom
  const siblingDataTranslated = initialTranslated ?? translatedData

  for (const field of fields) {
    if ('virtual' in field && field.virtual) {
      continue
    }

    switch (field.type) {
      case 'array': {
        const arrayDataFrom = siblingDataFrom[field.name]
        if (isEmpty(arrayDataFrom)) {
          break
        }
        let arrayDataTranslated = (siblingDataTranslated[field.name] ?? []) as any[]
        if (field.localized || localizedParent) {
          if (arrayDataTranslated.length > 0 && emptyOnly) {
            break
          }
          arrayDataTranslated = (arrayDataFrom as any[]).map(() => ({
            id: ObjectID().toHexString(),
          }))
        }
        arrayDataTranslated.forEach((item, index) => {
          traverseFields({
            dataFrom,
            emptyOnly,
            fields: field.fields,
            localizedParent: localizedParent ?? field.localized,
            payloadConfig,
            siblingDataFrom: (arrayDataFrom as any[])[index],
            siblingDataTranslated: item,
            translatedData,
            translateLexicalEmbeddedStrings,
            valuesToTranslate,
          })
        })
        siblingDataTranslated[field.name] = arrayDataTranslated
        break
      }
      case 'blocks': {
        const blocksDataFrom = siblingDataFrom[field.name]
        if (isEmpty(blocksDataFrom)) {
          break
        }
        let blocksDataTranslated = (siblingDataTranslated[field.name] ?? []) as any[]
        if (field.localized || localizedParent) {
          if (blocksDataTranslated.length > 0 && emptyOnly) {
            break
          }
          blocksDataTranslated = (blocksDataFrom as any[]).map(({ blockType }: any) => ({
            id: ObjectID().toHexString(),
            blockType,
          }))
        }
        blocksDataTranslated.forEach((item, index) => {
          let blockConfig: Block | undefined
          if (field.blockReferences) {
            blockConfig = payloadConfig.blocks?.find((b) => b.slug === item.blockType)
            if (!blockConfig) {
              console.warn(`Block config for block ${item.blockType} not found in payload config.`, field)
              return
            }
          } else {
            blockConfig = field.blocks.find((b) => b.slug === item.blockType)
            if (!blockConfig) {
              console.warn(`Block config for block ${item.blockType} not found in field config.`, field)
              return
            }
          }
          traverseFields({
            dataFrom,
            emptyOnly,
            fields: blockConfig.fields as Field[],
            localizedParent: localizedParent ?? field.localized,
            payloadConfig,
            siblingDataFrom: (blocksDataFrom as any[])[index],
            siblingDataTranslated: item,
            translatedData,
            translateLexicalEmbeddedStrings,
            valuesToTranslate,
          })
        })
        siblingDataTranslated[field.name] = blocksDataTranslated
        break
      }
      case 'checkbox':
      case 'code':
      case 'date':
      case 'email':
      case 'json':
      case 'number':
      case 'point':
      case 'radio':
      case 'relationship':
      case 'select':
      case 'upload':
        siblingDataTranslated[field.name] = siblingDataFrom[field.name]
        break
      case 'collapsible':
      case 'row':
        traverseFields({
          dataFrom,
          emptyOnly,
          fields: field.fields,
          localizedParent,
          payloadConfig,
          siblingDataFrom,
          siblingDataTranslated,
          translatedData,
          translateLexicalEmbeddedStrings,
          valuesToTranslate,
        })
        break
      case 'group': {
        if (!('name' in field)) {
          throw new Error('Unnamed groups are currently not supported by this translator.')
        }
        const groupDataFrom = siblingDataFrom[field.name]
        if (!groupDataFrom) {
          break
        }
        const groupDataTranslated =
          (siblingDataTranslated[field.name] as Record<string, unknown>) ?? {}
        traverseFields({
          dataFrom,
          emptyOnly,
          fields: field.fields,
          localizedParent: !!(localizedParent || field.localized),
          payloadConfig,
          siblingDataFrom: groupDataFrom as Record<string, unknown>,
          siblingDataTranslated: groupDataTranslated,
          translatedData,
          translateLexicalEmbeddedStrings,
          valuesToTranslate,
        })
        siblingDataTranslated[field.name] = groupDataTranslated
        break
      }
      case 'richText': {
        if (field.custom && typeof field.custom === 'object' && (field.custom as any).translatorSkip) {
          break
        }
        const translateEmbeddedRt =
          !!(translateLexicalEmbeddedStrings || field.localized || localizedParent)
        if (!translateEmbeddedRt || isEmpty(siblingDataFrom[field.name])) {
          break
        }
        if (emptyOnly && !isEmpty(siblingDataTranslated[field.name])) {
          break
        }
        const richTextDataFrom = siblingDataFrom[field.name]
        siblingDataTranslated[field.name] = richTextDataFrom
        if (!richTextDataFrom || typeof richTextDataFrom !== 'object') {
          break
        }
        const isLexical = 'root' in richTextDataFrom
        if (!isLexical) {
          break
        }
        const root = (siblingDataTranslated[field.name] as { root?: Record<string, unknown> })?.root
        if (root) {
          traverseRichText({
            emptyOnly,
            onText: (siblingData, key) => {
              valuesToTranslate.push({
                onTranslate: (translated) => {
                  siblingData[key] = translated
                },
                value: siblingData[key],
              })
            },
            payloadConfig,
            root,
            translatedData,
            translateLexicalEmbeddedStrings: translateEmbeddedRt,
            valuesToTranslate,
          })
        }
        break
      }
      case 'tabs':
        for (const tab of field.tabs) {
          const hasName = tabHasName(tab)
          const tabDataFrom = hasName ? siblingDataFrom[tab.name] : siblingDataFrom
          if (!tabDataFrom) {
            return
          }
          const tabDataTranslated = hasName
            ? ((siblingDataTranslated[tab.name] as Record<string, unknown>) ?? {})
            : siblingDataTranslated
          traverseFields({
            dataFrom,
            emptyOnly,
            fields: tab.fields,
            localizedParent: !!(localizedParent || tab.localized),
            payloadConfig,
            siblingDataFrom: tabDataFrom as Record<string, unknown>,
            siblingDataTranslated: tabDataTranslated,
            translatedData,
            translateLexicalEmbeddedStrings,
            valuesToTranslate,
          })
          if (hasName) {
            siblingDataTranslated[tab.name] = tabDataTranslated
          }
        }
        break
      case 'text':
      case 'textarea':
        if (field.custom && typeof field.custom === 'object' && (field.custom as any).translatorSkip) {
          break
        }
        const translateEmbeddedScalar =
          !!(translateLexicalEmbeddedStrings || field.localized || localizedParent)
        if (!translateEmbeddedScalar || isEmpty(siblingDataFrom[field.name])) {
          break
        }
        if (emptyOnly && siblingDataTranslated[field.name]) {
          break
        }
        if (field.name === 'blockName' || field.name === 'id') {
          break
        }
        valuesToTranslate.push({
          onTranslate: (translated) => {
            siblingDataTranslated[field.name] = translated
          },
          value: siblingDataFrom[field.name],
        })
        break
      default:
        break
    }
  }
}
