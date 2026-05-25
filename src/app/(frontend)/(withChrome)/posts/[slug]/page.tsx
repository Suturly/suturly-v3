import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import React, { cache } from 'react'

import type { Post } from '@/payload-types'

import { generateMeta } from '@/utilities/generateMeta'
import { hydratePostLexicalUploads } from '@/utilities/hydrateLexicalUploads'
import { hydratePostRelations } from '@/utilities/hydratePostRelations'
import { mergeEsResourceContentFromEn } from '@/utilities/mergeEsResourceContentFromEn'
import {
  buildResourceDetailPath,
  getRequestLocale,
  type AppLocale,
} from '@/utilities/requestLocale'
import { buildHeadingAnchors, extractH2Headings } from '@/utilities/richTextHeadings'
import PageClient, { ResourceTabsMain } from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'

/** Per-request locale (middleware header) + draft preview — cannot SSG; match /resources listing. */
export const revalidate = 600

type Args = {
  params: Promise<{
    slug?: string
  }>
}

type QuestionsToAskDoctorShape = Post['categorySections'] extends Array<infer T>
  ? T extends { content: infer C }
    ? C
    : never
  : never

const toSlugFallback = (value: string, fallback: string) => {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')

  return normalized || fallback
}

export default async function Post({ params: paramsPromise }: Args) {
  const locale = await getRequestLocale()
  const { isEnabled: draft } = await draftMode()
  const { slug = '' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const url = '/posts/' + decodedSlug
  const post = await loadPostForResourcePage({ slug: decodedSlug, locale })

  if (!post) {
    if (locale === 'es') notFound()
    return <PayloadRedirects url={url} />
  }

  const sections =
    post.categorySections?.map((section, index) => {
      const categoryNameFallback = `Section ${index + 1}`
      const categoryName =
        typeof section?.category === 'object' && section.category && 'title' in section.category
          ? (section.category.title as string)
          : categoryNameFallback
      const categorySlug =
        typeof section?.category === 'object' &&
        section.category &&
        'slug' in section.category &&
        typeof section.category.slug === 'string'
          ? section.category.slug
          : toSlugFallback(categoryName, `section-${index + 1}`)

      const sectionId = `chapter-${index + 1}`
      const headingAnchors = buildHeadingAnchors(extractH2Headings(section.content), sectionId)

      return {
        id: sectionId,
        name: categoryName,
        categorySlug,
        content: section.content,
        headingAnchors,
        nextStepBannerDescription:
          typeof section?.category === 'object' &&
          section.category &&
          'nextStepBannerDescription' in section.category &&
          typeof section.category.nextStepBannerDescription === 'string'
            ? section.category.nextStepBannerDescription
            : '',
        nextStepBannerTitle:
          typeof section?.category === 'object' &&
          section.category &&
          'nextStepBannerTitle' in section.category &&
          typeof section.category.nextStepBannerTitle === 'string'
            ? section.category.nextStepBannerTitle
            : '',
      }
    }) || []
  const questionsToAskDoctor =
    ((post as unknown as { questionsToAskDoctor?: QuestionsToAskDoctorShape | null })
      .questionsToAskDoctor as QuestionsToAskDoctorShape | null | undefined) ?? undefined

  const canonicalSlug =
    typeof post.slug === 'string' && post.slug.trim() ? post.slug.trim() : decodedSlug
  const resourcePath = buildResourceDetailPath(locale, canonicalSlug)

  return (
    <article className="resource-page">
      <PageClient />

      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <div className="container">
        <ResourceTabsMain
          benefits={post.benefits}
          citations={post.citations}
          coverImage={post.coverImage}
          initialActiveTab={sections[0]?.categorySlug}
          lastUpdatedOn={post.lastUpdatedOn}
          postTitle={post.title}
          publishedAt={post.publishedAt}
          questionsToAskDoctor={questionsToAskDoctor}
          resourcePath={resourcePath}
          sections={sections}
        />
      </div>
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const locale = await getRequestLocale()
  const { slug = '' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const post = await loadPostForResourcePage({ slug: decodedSlug, locale })

  return generateMeta({ doc: post })
}

const loadPostForResourcePage = cache(
  async ({ slug, locale }: { slug: string; locale: AppLocale }): Promise<Post | null> => {
    const doc = await queryPostBySlug({ slug, locale })
    if (!doc) return null

    if (locale !== 'es') return doc as Post

    if ((doc as Post).spanishMirrorsEnglish === false) return doc as Post

    const { isEnabled: draft } = await draftMode()
    const payload = await getPayload({ config: configPromise })
    /** Same as {@link queryPostBySlug}: need depth 2 for uploads inside Lexical blocks. */
    const relDepth = draft ? 0 : 2
    const enRaw = await payload.findByID({
      collection: 'posts',
      id: doc.id,
      draft,
      depth: relDepth,
      locale: 'en',
      overrideAccess: draft,
    })

    if (!enRaw) return doc as Post

    const enDoc = draft ? await hydratePostRelations(payload, enRaw as Post) : (enRaw as Post)

    const merged = mergeEsResourceContentFromEn(doc as Post, enDoc)
    await hydratePostLexicalUploads(payload, merged)
    return merged
  },
)

const queryPostBySlug = cache(async ({ slug, locale }: { slug: string; locale: AppLocale }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })
  /** Draft preview + Drizzle can mishandle populated uploads (media rows as IDs); hydrate explicitly below.
   *  Published requests use depth 2 so uploads inside Lexical blocks (e.g. procedure type card image) populate. */
  const relDepth = draft ? 0 : 2

  const result = await payload.find({
    collection: 'posts',
    draft,
    depth: relDepth,
    limit: 1,
    locale,
    overrideAccess: draft,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  let doc = result.docs?.[0] ?? null

  // ES slug column may be empty while EN slug matches the URL segment — resolve via EN post id.
  if (!doc && locale === 'es') {
    const enHit = await payload.find({
      collection: 'posts',
      draft,
      depth: relDepth,
      limit: 1,
      locale: 'en',
      overrideAccess: draft,
      pagination: false,
      where: {
        slug: {
          equals: slug,
        },
      },
    })
    const enDoc = enHit.docs?.[0]
    if (enDoc?.id) {
      doc =
        (await payload.findByID({
          collection: 'posts',
          id: enDoc.id,
          draft,
          depth: relDepth,
          locale: 'es',
          overrideAccess: draft,
        })) ?? null
    }
  }

  if (doc) {
    await hydratePostLexicalUploads(payload, doc as Post)
  }

  if (doc && draft) {
    return hydratePostRelations(payload, doc as Post)
  }

  return doc
})
