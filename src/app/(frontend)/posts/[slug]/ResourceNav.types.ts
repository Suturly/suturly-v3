import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

export type HeadingAnchor = {
  id: string
  text: string
}

export type SectionTab = {
  id: string
  name: string
  categorySlug: string
  content: DefaultTypedEditorState
  headingAnchors: HeadingAnchor[]
  nextStepBannerDescription: string
  nextStepBannerTitle: string
}
