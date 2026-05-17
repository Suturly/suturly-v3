import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import React, { cache } from 'react'

import type { Post } from '@/payload-types'

import { generateMeta } from '@/utilities/generateMeta'
import { mergeEsResourceContentFromEn } from '@/utilities/mergeEsResourceContentFromEn'
import {
  buildResourceDetailPath,
  getRequestLocale,
  type AppLocale,
} from '@/utilities/requestLocale'
import { buildHeadingAnchors, extractH2Headings } from '@/utilities/richTextHeadings'
import PageClient, { ResourceTabsMain } from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const slugSet = new Set<string>()

  for (const locale of ['en', 'es'] satisfies AppLocale[]) {
    const posts = await payload.find({
      collection: 'posts',
      draft: false,
      limit: 1000,
      overrideAccess: false,
      pagination: false,
      locale,
      select: {
        slug: true,
      },
    })
    for (const doc of posts.docs) {
      const s = doc.slug
      if (typeof s === 'string' && s.trim()) slugSet.add(s)
    }
  }

  return [...slugSet].map((slug) => ({ slug }))
}

type Args = {
  params: Promise<{
    slug?: string
  }>
  searchParams: Promise<{
    tab?: string | string[]
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

export default async function Post({ params: paramsPromise, searchParams: searchParamsPromise }: Args) {
  const locale = await getRequestLocale()
  const { isEnabled: draft } = await draftMode()
  const { slug = '' } = await paramsPromise
  const searchParams = await searchParamsPromise
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

  const requestedTab = Array.isArray(searchParams?.tab) ? searchParams.tab[0] : searchParams?.tab
  const activeTab = sections.find((section) => section.categorySlug === requestedTab)?.categorySlug
    ? requestedTab
    : sections[0]?.categorySlug
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
          initialActiveTab={activeTab}
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
    const enDoc = await payload.findByID({
      collection: 'posts',
      id: doc.id,
      draft,
      locale: 'en',
      overrideAccess: draft,
    })

    if (!enDoc) return doc as Post

    return mergeEsResourceContentFromEn(doc as Post, enDoc as Post)
  },
)

const queryPostBySlug = cache(async ({ slug, locale }: { slug: string; locale: AppLocale }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'posts',
    draft,
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
          locale: 'es',
          overrideAccess: draft,
        })) ?? null
    }
  }

  return doc
})
