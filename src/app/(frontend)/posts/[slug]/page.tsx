import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'

import type { Post } from '@/payload-types'

import { generateMeta } from '@/utilities/generateMeta'
import { buildHeadingAnchors, extractH2Headings } from '@/utilities/richTextHeadings'
import PageClient, { ResourceTabsMain } from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const posts = await payload.find({
    collection: 'posts',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
  })

  const params = posts.docs.map(({ slug }) => {
    return { slug }
  })

  return params
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
  const { isEnabled: draft } = await draftMode()
  const { slug = '' } = await paramsPromise
  const searchParams = await searchParamsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const url = '/posts/' + decodedSlug
  const post = await queryPostBySlug({ slug: decodedSlug })

  if (!post) return <PayloadRedirects url={url} />

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
  const resourcePath = `/resources/${encodeURIComponent(decodedSlug)}`

  return (
    <article className="resource-page">
      <PageClient />

      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <div className="container">
        <ResourceTabsMain
          benefits={post.benefits}
          coverImage={post.coverImage}
          initialActiveTab={activeTab}
          postTitle={post.title}
          questionsToAskDoctor={questionsToAskDoctor}
          resourcePath={resourcePath}
          sections={sections}
        />
      </div>
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const post = await queryPostBySlug({ slug: decodedSlug })

  return generateMeta({ doc: post })
}

const queryPostBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'posts',
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
})
