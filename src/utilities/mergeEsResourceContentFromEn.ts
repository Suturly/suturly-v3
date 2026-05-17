import type { Post } from '@/payload-types'

function isEmptyLexical(value: unknown): boolean {
  if (!value || typeof value !== 'object' || value === null || !('root' in value)) return true
  const root = (value as { root?: { children?: unknown[] } }).root
  if (!root || typeof root !== 'object' || !Array.isArray(root.children)) return true
  if (root.children.length === 0) return true
  const first = root.children[0] as { children?: unknown[] }
  if (
    root.children.length === 1 &&
    first &&
    Array.isArray(first.children) &&
    first.children.length === 0
  ) {
    return true
  }
  return false
}

const nz = (s: unknown): string => (typeof s === 'string' ? s.trim() : '')

function mergeBenefits(
  es?: Post['benefits'] | null,
  en?: Post['benefits'] | null,
): Post['benefits'] | null | undefined {
  if (!es?.length) return en
  if (!en?.length) return es
  return es.map((b, i) => {
    const n = en[i]
    if (!n) return b
    return {
      ...b,
      title: nz(b.title) ? b.title : n.title,
      description: nz(b.description) ? b.description : n.description,
    }
  })
}

function mergeCategorySections(
  es?: Post['categorySections'] | null,
  en?: Post['categorySections'] | null,
): Post['categorySections'] | null | undefined {
  if (!es?.length) return en
  if (!en?.length) return es
  return es.map((sec, i) => {
    const enSec = en[i]
    if (!enSec) return sec
    const content = isEmptyLexical(sec.content) ? enSec.content : sec.content
    return { ...sec, content }
  })
}

function mergeCitations(
  es?: Post['citations'] | null,
  en?: Post['citations'] | null,
): Post['citations'] | null | undefined {
  if (!es?.length) return en
  if (!en?.length) return es
  return es.map((row) => {
    const enRow = en.find((r) => r.key === row.key)
    if (!enRow) return row
    return {
      ...row,
      bibliography: nz(row.bibliography) ? row.bibliography : enRow.bibliography,
      url: nz(row.url ?? '') ? row.url : enRow.url,
    }
  })
}

function mergeMeta(es?: Post['meta'], en?: Post['meta']): Post['meta'] | undefined {
  if (!es && !en) return undefined
  const a = es ?? {}
  const b = en ?? {}
  return {
    ...a,
    title: nz(a.title) ? a.title : b.title,
    description: nz(a.description) ? a.description : b.description,
    image: a.image ?? b.image,
  }
}

/**
 * Fill empty Spanish localized fields from English for public rendering while
 * {@link Post.spanishMirrorsEnglish} is still true (Spanish not intentionally detached).
 */
export function mergeEsResourceContentFromEn(es: Post, en: Post): Post {
  const merged: Post = { ...es }

  if (!nz(merged.title)) merged.title = en.title
  if (!nz(merged.slug)) merged.slug = en.slug

  merged.benefits = mergeBenefits(es.benefits, en.benefits)
  merged.categorySections = mergeCategorySections(es.categorySections, en.categorySections)

  if (isEmptyLexical(es.questionsToAskDoctor)) {
    merged.questionsToAskDoctor = en.questionsToAskDoctor ?? null
  }

  merged.citations = mergeCitations(es.citations, en.citations)
  merged.meta = mergeMeta(es.meta, en.meta)

  return merged
}
