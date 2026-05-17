import type { Payload } from 'payload'

import type { Post } from '@/payload-types'

import { ensureMedia } from '@/utilities/hydratePostRelations'

function isLexicalState(value: unknown): value is { root: { children?: unknown[] } } {
  if (value == null || typeof value !== 'object') return false
  const r = (value as { root?: unknown }).root
  return typeof r === 'object' && r != null
}

async function walkNodes(nodes: unknown[], payload: Payload): Promise<void> {
  for (const raw of nodes) {
    if (!raw || typeof raw !== 'object') continue
    const node = raw as Record<string, unknown>
    const type = node.type

    if (type === 'block' && node.fields && typeof node.fields === 'object') {
      const fields = node.fields as Record<string, unknown>
      const blockType = fields.blockType
      if (typeof blockType === 'string') {
        await hydrateBlockUploadFields(blockType, fields, payload)
      }
      for (const v of Object.values(fields)) {
        if (isLexicalState(v)) {
          await walkLexicalState(v, payload)
        }
      }
    }

    if (type === 'upload' && node.relationTo === 'media') {
      const v = node.value
      if (v != null && (typeof v !== 'object' || !('url' in (v as object)))) {
        node.value = await ensureMedia(payload, v)
      }
    }

    const children = node.children
    if (Array.isArray(children)) {
      await walkNodes(children, payload)
    }
  }
}

async function hydrateBlockUploadFields(
  blockType: string,
  fields: Record<string, unknown>,
  payload: Payload,
): Promise<void> {
  switch (blockType) {
    case 'mediaBlock':
      fields.media = await ensureMedia(payload, fields.media)
      break
    case 'twoColumnImages':
      fields.leftImage = await ensureMedia(payload, fields.leftImage)
      fields.rightImage = await ensureMedia(payload, fields.rightImage)
      break
    case 'floatImage':
      fields.media = await ensureMedia(payload, fields.media)
      break
    case 'procedureTypeCard': {
      fields.image = await ensureMedia(payload, fields.image)
      const chips = fields.chips
      if (Array.isArray(chips)) {
        for (const chip of chips) {
          if (chip && typeof chip === 'object' && 'icon' in chip) {
            ;(chip as { icon: unknown }).icon = await ensureMedia(
              payload,
              (chip as { icon: unknown }).icon,
            )
          }
        }
      }
      break
    }
    case 'doDontCard':
      fields.image = await ensureMedia(payload, fields.image)
      break
    default:
      break
  }
}

async function walkLexicalState(value: unknown, payload: Payload): Promise<void> {
  if (!isLexicalState(value)) return
  const children = value.root.children
  if (Array.isArray(children)) {
    await walkNodes(children, payload)
  }
}

/**
 * Resolves media uploads stored as IDs inside Lexical JSON (custom blocks, inline upload nodes).
 * Payload depth alone may not populate every upload in REST reads; this matches draft
 * {@link ensureMedia} hydration used in {@link hydratePostRelations}.
 */
export async function hydratePostLexicalUploads(payload: Payload, doc: Post): Promise<Post> {
  if (!doc || typeof doc !== 'object') return doc

  if (Array.isArray(doc.categorySections)) {
    for (const sec of doc.categorySections) {
      if (sec && typeof sec === 'object' && 'content' in sec) {
        await walkLexicalState((sec as { content?: unknown }).content, payload)
      }
    }
  }

  if (doc.questionsToAskDoctor) {
    await walkLexicalState(doc.questionsToAskDoctor, payload)
  }

  return doc
}
