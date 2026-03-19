import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { DoDontCard } from '@/blocks/DoDontCard/Component'
import { Dropdown } from '@/blocks/Dropdown/Component'
import { InfoBox } from '@/blocks/InfoBox/Component'
import { Timeline } from '@/blocks/Timeline/Component'
import { ToDoList } from '@/blocks/ToDoList/Component'
import { FloatImage } from '@/blocks/FloatImage/Component'
import { TwoColumnImages } from '@/blocks/TwoColumnImages/Component'
import {
  DefaultNodeTypes,
  SerializedBlockNode,
  SerializedLinkNode,
  type DefaultTypedEditorState,
} from '@payloadcms/richtext-lexical'
import {
  JSXConvertersFunction,
  RichText as ConvertRichText,
} from '@payloadcms/richtext-lexical/react'

import { CodeBlock, CodeBlockProps } from '@/blocks/Code/Component'

import type {
  BannerBlock as BannerBlockProps,
  CallToActionBlock as CTABlockProps,
  FloatImageBlock as FloatImageBlockProps,
  MediaBlock as MediaBlockProps,
  TwoColumnImagesBlock as TwoColumnImagesBlockProps,
} from '@/payload-types'
import { BannerBlock } from '@/blocks/Banner/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { cn } from '@/utilities/ui'
import { buildHeadingAnchors } from '@/utilities/richTextHeadings'
import React from 'react'

type NodeTypes =
  | DefaultNodeTypes
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

const createConverters = ({
  anchorHeadings = false,
  anchorPrefix = 'section',
  linkCitations,
}: {
  anchorHeadings?: boolean
  anchorPrefix?: string
  linkCitations?: Record<string, number>
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

  return ({ defaultConverters }) => ({
    ...defaultConverters,
    link: ({ node, nodesToJSX }) => {
      const linkNode = node as SerializedLinkNode
      const href = getHrefFromLinkNode(linkNode)
      const children = nodesToJSX({ nodes: linkNode.children })
      const newTab = Boolean(linkNode.fields?.newTab)
      const nodeId =
        typeof (linkNode as unknown as { id?: unknown }).id === 'string'
          ? ((linkNode as unknown as { id: string }).id as string)
          : null
      const citation = nodeId ? linkCitations?.[nodeId] : undefined
      const citationNode = citation ? (
        <span className="payload-richtext__citation-anchor">
          <sup className="payload-richtext__citation">{citation}</sup>
        </span>
      ) : null

      if (!href) {
        return (
          <React.Fragment>
            {children}
            {citationNode}
          </React.Fragment>
        )
      }

      return (
        <a href={href} rel={newTab ? 'noopener noreferrer' : undefined} target={newTab ? '_blank' : undefined}>
          {children}
          {citationNode}
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
    blocks: {
      banner: ({ node }) => (
        <BannerBlock className="col-start-2 mb-4" linkCitations={linkCitations} {...node.fields} />
      ),
      mediaBlock: ({ node }) => (
        <MediaBlock
          className="col-start-1 col-span-3"
          imgClassName="m-0"
          linkCitations={linkCitations}
          {...node.fields}
          captionClassName="mx-auto max-w-[48rem]"
          enableGutter={false}
          disableInnerContainer={true}
        />
      ),
      code: ({ node }) => <CodeBlock className="col-start-2" {...node.fields} />,
      cta: ({ node }) => <CallToActionBlock linkCitations={linkCitations} {...node.fields} />,
      twoColumnImages: ({ node }) => (
        <TwoColumnImages className="col-start-2 my-4" {...node.fields} />
      ),
      floatImage: ({ node }) => <FloatImage className="col-start-2" {...node.fields} />,
      doDontCard: ({ node }: { node: { fields: DoDontCardBlockProps } }) => (
        <DoDontCard className="col-start-2 my-4" linkCitations={linkCitations} {...node.fields} />
      ),
      infoBox: ({ node }: { node: { fields: InfoBoxBlockProps } }) => (
        <InfoBox className="col-start-2 my-4" {...node.fields} />
      ),
      dropdown: ({ node }: { node: { fields: DropdownBlockProps } }) => (
        <Dropdown className="col-start-2" linkCitations={linkCitations} {...node.fields} />
      ),
      timeline: ({ node }: { node: { fields: TimelineBlockProps } }) => (
        <Timeline className="col-start-2 my-4" linkCitations={linkCitations} {...node.fields} />
      ),
      todoList: ({ node }: { node: { fields: ToDoListBlockProps } }) => (
        <ToDoList className="col-start-2 my-4" {...node.fields} />
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
} & React.HTMLAttributes<HTMLDivElement>

export default function RichText(props: Props) {
  const {
    className,
    enableProse = true,
    enableGutter = true,
    anchorHeadings = false,
    anchorPrefix = 'section',
    linkCitations,
    ...rest
  } = props
  return (
    <ConvertRichText
      converters={createConverters({ anchorHeadings, anchorPrefix, linkCitations })}
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
    />
  )
}
