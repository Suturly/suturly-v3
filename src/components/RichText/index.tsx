import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { DoDontCard } from '@/blocks/DoDontCard/Component'
import { Dropdown } from '@/blocks/Dropdown/Component'
import { InfoBox } from '@/blocks/InfoBox/Component'
import { Timeline } from '@/blocks/Timeline/Component'
import { ProcedureTypeCard } from '@/blocks/ProcedureTypeCard/Component'
import { ToDoList } from '@/blocks/ToDoList/Component'
import { FloatImage } from '@/blocks/FloatImage/Component'
import { TwoColumnImages } from '@/blocks/TwoColumnImages/Component'
import {
  DefaultNodeTypes,
  SerializedBlockNode,
  SerializedInlineBlockNode,
  SerializedLinkNode,
  type DefaultTypedEditorState,
} from '@payloadcms/richtext-lexical'
import {
  convertLexicalNodesToJSX,
  defaultJSXConverters,
  JSXConvertersFunction,
  RichText as ConvertRichText,
} from '@payloadcms/richtext-lexical/react'

import { CodeBlock, CodeBlockProps } from '@/blocks/Code/Component'

import type {
  BannerBlock as BannerBlockProps,
  CallToActionBlock as CTABlockProps,
  FloatImageBlock as FloatImageBlockProps,
  MediaBlock as MediaBlockProps,
  ProcedureTypeCardBlock as ProcedureTypeCardBlockProps,
  TwoColumnImagesBlock as TwoColumnImagesBlockProps,
} from '@/payload-types'
import { BannerBlock } from '@/blocks/Banner/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { cn } from '@/utilities/ui'
import {
  getParentChildArray,
  isChapterCitationInlineBlock,
  trimLastTextLeafForCitationSpacing,
  trimTrailingCollapsibleAsciiSpaceBeforeCite,
} from '@/utilities/chapterCitationSiblingSpacing'
import { groupLexicalRootChildrenByH2, isLexicalH2HeadingNode } from '@/utilities/groupLexicalNodesByH2'
import { buildHeadingAnchors } from '@/utilities/richTextHeadings'
import { ChapterCitationAnchor } from '@/components/RichText/ChapterCitationAnchor'
import type { SerializedLexicalNode } from 'lexical'
import React from 'react'

type ChapterCitationFields = {
  blockType: 'chapterCitation'
  id: string
  refKey: string
}

type NodeTypes =
  | DefaultNodeTypes
  | SerializedInlineBlockNode<ChapterCitationFields>
  | SerializedBlockNode<
      | CTABlockProps
      | MediaBlockProps
      | BannerBlockProps
      | CodeBlockProps
      | TwoColumnImagesBlockProps
      | FloatImageBlockProps
      | DoDontCardBlockProps
      | InfoBoxBlockProps
      | DropdownBlockProps
      | TimelineBlockProps
      | ToDoListBlockProps
      | ProcedureTypeCardBlockProps
    >

type DoDontCardBlockProps = {
  type?: 'do' | 'dont' | null
  title?: string | null
  content?: DefaultTypedEditorState | null
  image?: object | string | number | null
}

type InfoBoxBlockProps = {
  title?: string | null
  description?: string | null
}

type DropdownBlockProps = {
  title?: string | null
  description?: DefaultTypedEditorState | null
}

type TimelineBlockProps = {
  items?: Array<{
    timeLabel?: string | null
    content?: DefaultTypedEditorState | null
  }> | null
}

type ToDoListBlockProps = {
  items?: Array<{
    label?: string | null
    checked?: boolean | null
    id?: string | null
  }> | null
  showCopyButton?: boolean | null
  copyButtonLabel?: string | null
}

const internalDocToHref = ({ linkNode }: { linkNode: SerializedLinkNode }) => {
  const { value, relationTo } = linkNode.fields.doc!
  if (typeof value !== 'object') {
    throw new Error('Expected value to be an object')
  }
  const slug = value.slug
  return relationTo === 'posts' ? `/resources/${slug}` : `/${slug}`
}

const getHrefFromLinkNode = (linkNode: SerializedLinkNode): string | null => {
  if (linkNode.fields?.linkType === 'internal') {
    try {
      return internalDocToHref({ linkNode })
    } catch {
      return null
    }
  }

  const url = linkNode.fields?.url
  return typeof url === 'string' && url.trim().length > 0 ? url : null
}

const createConverters = ({
  anchorHeadings = false,
  anchorPrefix = 'section',
  linkCitations,
  citationLinkLabels,
  citationHrefs,
}: {
  anchorHeadings?: boolean
  anchorPrefix?: string
  linkCitations?: Record<string, number>
  citationLinkLabels?: Record<string, string>
  citationHrefs?: Record<string, string>
}): JSXConvertersFunction<NodeTypes> => {
  const headingCounters: Record<string, number> = {}
  const headingIdByNode = new WeakMap<object, string>()
  const collectHeadingText = (value: unknown): string => {
    if (!value) return ''
    if (Array.isArray(value)) return value.map((item) => collectHeadingText(item)).join('')
    if (typeof value !== 'object') return ''

    const node = value as { children?: unknown; text?: unknown }
    if (typeof node.text === 'string') return node.text
    return collectHeadingText(node.children)
  }

  return ({ defaultConverters }) => ({
    ...defaultConverters,
    text: (args) => {
      const textFn = defaultConverters.text
      if (typeof textFn !== 'function') return null
      const { node, parent, childIndex } = args
      const siblings = getParentChildArray(parent)
      const next =
        typeof childIndex === 'number' && siblings ? siblings[childIndex + 1] : undefined
      let outNode = node
      if (
        node &&
        typeof node === 'object' &&
        'text' in node &&
        typeof (node as { text: unknown }).text === 'string' &&
        isChapterCitationInlineBlock(next)
      ) {
        const raw = (node as { text: string }).text
        const t = trimTrailingCollapsibleAsciiSpaceBeforeCite(raw)
        if (t !== raw) outNode = { ...node, text: t } as typeof node
      }
      return textFn({ ...args, node: outNode })
    },
    link: ({ node, nodesToJSX, parent, childIndex }) => {
      const linkNode = node as SerializedLinkNode
      const href = getHrefFromLinkNode(linkNode)
      const siblings = getParentChildArray(parent)
      const trimForCite =
        typeof childIndex === 'number' &&
        siblings &&
        isChapterCitationInlineBlock(siblings[childIndex + 1])
      let nodesForJsx = linkNode.children
      if (trimForCite && Array.isArray(nodesForJsx) && nodesForJsx.length > 0) {
        nodesForJsx = trimLastTextLeafForCitationSpacing(nodesForJsx as SerializedLexicalNode[])
      }
      const children = nodesToJSX({ nodes: nodesForJsx })
      const newTab = Boolean(linkNode.fields?.newTab)

      if (!href) {
        return <React.Fragment>{children}</React.Fragment>
      }

      return (
        <a href={href} rel={newTab ? 'noopener noreferrer' : undefined} target={newTab ? '_blank' : undefined}>
          {children}
        </a>
      )
    },
    autolink: ({ node, nodesToJSX, parent, childIndex }) => {
      const linkNode = node
      const href = typeof linkNode.fields?.url === 'string' ? linkNode.fields.url : null
      const siblings = getParentChildArray(parent)
      const trimForCite =
        typeof childIndex === 'number' &&
        siblings &&
        isChapterCitationInlineBlock(siblings[childIndex + 1])
      let nodesForJsx = linkNode.children
      if (trimForCite && Array.isArray(nodesForJsx) && nodesForJsx.length > 0) {
        nodesForJsx = trimLastTextLeafForCitationSpacing(nodesForJsx as SerializedLexicalNode[])
      }
      const children = nodesToJSX({ nodes: nodesForJsx })
      const newTab = Boolean(linkNode.fields?.newTab)

      if (!href) {
        return <React.Fragment>{children}</React.Fragment>
      }

      return (
        <a href={href} rel={newTab ? 'noopener noreferrer' : undefined} target={newTab ? '_blank' : undefined}>
          {children}
        </a>
      )
    },
    heading: ({ node, nodesToJSX }) => {
      const Tag = (node.tag || 'h2') as React.ElementType
      const children = nodesToJSX({ nodes: node.children })

      if (!anchorHeadings || node.tag !== 'h2') return <Tag>{children}</Tag>

      if (typeof node === 'object' && node !== null) {
        const existingId = headingIdByNode.get(node as object)
        if (existingId) {
          return <Tag id={existingId}>{children}</Tag>
        }
      }

      const text = collectHeadingText(node.children).trim()
      const [anchor] = buildHeadingAnchors([text || 'section'], anchorPrefix)
      const baseId = anchor.id
      const count = headingCounters[baseId] ?? 0
      headingCounters[baseId] = count + 1
      const id = count > 0 ? `${baseId}-${count + 1}` : baseId

      if (typeof node === 'object' && node !== null) {
        headingIdByNode.set(node as object, id)
      }

      return <Tag id={id}>{children}</Tag>
    },
    inlineBlocks: {
      chapterCitation: ({ node }) => {
        const id = typeof node.fields?.id === 'string' ? node.fields.id : null
        const refNum = id ? linkCitations?.[id] : undefined
        const linkText = id ? citationLinkLabels?.[id] : undefined
        const sourceHref = id ? (citationHrefs?.[id] ?? '') : ''
        if (refNum == null) {
          const rk = typeof node.fields?.refKey === 'string' ? node.fields.refKey : ''
          return (
            <span className="payload-richtext__citation-wrap" title={rk || 'Citation'}>
              {'\u00A0'}
              <span className="payload-richtext__citation">?</span>
            </span>
          )
        }
        return (
          <ChapterCitationAnchor linkText={linkText} refId={refNum} sourceHref={sourceHref} />
        )
      },
    },
    blocks: {
      banner: ({ node }) => (
        <BannerBlock
          citationHrefs={citationHrefs}
          citationLinkLabels={citationLinkLabels}
          className="col-start-2 mb-4"
          linkCitations={linkCitations}
          {...node.fields}
        />
      ),
      mediaBlock: ({ node }) => (
        <MediaBlock
          className="col-start-1 col-span-3"
          imgClassName="m-0"
          citationHrefs={citationHrefs}
          citationLinkLabels={citationLinkLabels}
          linkCitations={linkCitations}
          {...node.fields}
          captionClassName="mx-auto max-w-[48rem]"
          enableGutter={false}
          disableInnerContainer={true}
        />
      ),
      code: ({ node }) => <CodeBlock className="col-start-2" {...node.fields} />,
      cta: ({ node }) => (
        <CallToActionBlock
          citationHrefs={citationHrefs}
          citationLinkLabels={citationLinkLabels}
          linkCitations={linkCitations}
          {...node.fields}
        />
      ),
      twoColumnImages: ({ node }) => (
        <TwoColumnImages
          citationHrefs={citationHrefs}
          citationLinkLabels={citationLinkLabels}
          className="col-start-2 my-4"
          linkCitations={linkCitations}
          {...node.fields}
        />
      ),
      floatImage: ({ node }) => <FloatImage className="col-start-2" {...node.fields} />,
      doDontCard: ({ node }: { node: { fields: DoDontCardBlockProps } }) => (
        <DoDontCard
          citationHrefs={citationHrefs}
          citationLinkLabels={citationLinkLabels}
          className="col-start-2 my-4"
          linkCitations={linkCitations}
          {...node.fields}
        />
      ),
      infoBox: ({ node }: { node: { fields: InfoBoxBlockProps } }) => (
        <InfoBox className="col-start-2 my-4" {...node.fields} />
      ),
      dropdown: ({ node }: { node: { fields: DropdownBlockProps } }) => (
        <Dropdown
          citationHrefs={citationHrefs}
          citationLinkLabels={citationLinkLabels}
          className="col-start-2"
          linkCitations={linkCitations}
          {...node.fields}
        />
      ),
      timeline: ({ node }: { node: { fields: TimelineBlockProps } }) => (
        <Timeline
          citationHrefs={citationHrefs}
          citationLinkLabels={citationLinkLabels}
          className="col-start-2 my-4"
          linkCitations={linkCitations}
          {...node.fields}
        />
      ),
      todoList: ({ node }: { node: { fields: ToDoListBlockProps } }) => (
        <ToDoList className="col-start-2 my-4" {...node.fields} />
      ),
      procedureTypeCard: ({ node }: { node: { fields: ProcedureTypeCardBlockProps } }) => (
        <ProcedureTypeCard
          citationHrefs={citationHrefs}
          citationLinkLabels={citationLinkLabels}
          className="col-start-2 my-4"
          linkCitations={linkCitations}
          {...node.fields}
        />
      ),
    },
  })
}

type Props = {
  data: DefaultTypedEditorState
  enableGutter?: boolean
  enableProse?: boolean
  anchorHeadings?: boolean
  anchorPrefix?: string
  linkCitations?: Record<string, number>
  citationLinkLabels?: Record<string, string>
  citationHrefs?: Record<string, string>
  /**
   * Wrap each top-level segment (from one `h2` to the next) in `<section class="resource-category-h2-section">`
   * for sticky chapter subheadings. Use with chapter resource body content only.
   */
  sectionizeByH2?: boolean
  disableIndent?: boolean | string[]
  disableTextAlign?: boolean | string[]
} & React.HTMLAttributes<HTMLDivElement>

export default function RichText(props: Props) {
  const {
    data,
    className,
    enableProse = true,
    enableGutter = true,
    anchorHeadings = false,
    anchorPrefix = 'section',
    linkCitations,
    citationLinkLabels,
    citationHrefs,
    sectionizeByH2 = false,
    disableIndent,
    disableTextAlign,
    ...rest
  } = props

  if (sectionizeByH2 && data?.root?.children?.length) {
    const converters = createConverters({
      anchorHeadings,
      anchorPrefix,
      citationHrefs,
      citationLinkLabels,
      linkCitations,
    })({
      defaultConverters: defaultJSXConverters,
    })
    const groups = groupLexicalRootChildrenByH2(data.root.children)
    return (
      <div
        className={cn(
          'payload-richtext',
          {
            'payload-richtext--gutter': enableGutter,
            'payload-richtext--no-gutter': !enableGutter,
            'payload-richtext--prose': enableProse,
          },
          className,
        )}
        {...rest}
      >
        {groups.map((nodes, index) => {
          const isPreface = index === 0 && nodes.length > 0 && !isLexicalH2HeadingNode(nodes[0])
          return (
            <section
              key={index}
              className={cn(
                'resource-category-h2-section',
                isPreface && 'resource-category-h2-section--preface',
              )}
            >
              {convertLexicalNodesToJSX({
                // Aligns with ConvertRichText; package JSXConverters generic differs slightly from our NodeTypes union.
                converters: converters as Parameters<typeof convertLexicalNodesToJSX>[0]['converters'],
                disableIndent,
                disableTextAlign,
                nodes,
                parent: data.root as Parameters<typeof convertLexicalNodesToJSX>[0]['parent'],
              })}
            </section>
          )
        })}
      </div>
    )
  }

  return (
    <ConvertRichText
      converters={createConverters({
        anchorHeadings,
        anchorPrefix,
        citationHrefs,
        citationLinkLabels,
        linkCitations,
      })}
      className={cn(
        'payload-richtext',
        {
          'payload-richtext--gutter': enableGutter,
          'payload-richtext--no-gutter': !enableGutter,
          'payload-richtext--prose': enableProse,
        },
        className,
      )}
      data={data}
      disableIndent={disableIndent}
      disableTextAlign={disableTextAlign}
      {...rest}
    />
  )
}
