import type { Metadata } from 'next'
import { getServerSideURL } from './getURL'

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description:
    'Suturly delivers procedure-specific education to surgical patients via timed SMS nudges and web guides — from pre-op through recovery.',
  images: [
    {
      url: `${getServerSideURL()}/OG/home.png`,
      width: 1200,
      height: 630,
      alt: 'Suturly — patient guidance platform',
    },
  ],
  siteName: 'Suturly',
  title: 'Suturly — Procedure-specific patient guidance',
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
