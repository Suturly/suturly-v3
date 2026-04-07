import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Styles',
  description: 'Design system playground and style reference page.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function StylesPage() {
  return (
    <main className="py-20 md:py-28">
      <section className="container">
        <div className="max-w-3xl space-y-6">
          <p className="text-sm font-medium tracking-wide uppercase text-primary">Styles</p>
          <h1 className="text-4xl md:text-5xl font-semibold leading-tight text-foreground">
            Practical resources for your next growth phase.
          </h1>
          <p className="text-base md:text-lg text-muted-foreground">
            This is the new core page. We will expand this area with guides, templates, and curated
            content.
          </p>
          <div className="pt-2">
            <Button asChild>
              <Link href="/posts">Browse posts</Link>
            </Button>
          </div>

          <div className="pt-8 space-y-4">
            <p className="text-p-sm text-muted-foreground">System button variants (big)</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button>Default</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button iconRight={<ArrowRight />}>With right icon</Button>
              <Button iconLeft={<ArrowRight />}>With left icon</Button>
            </div>
            <p className="text-p-sm text-muted-foreground">System button variants (small)</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="small">Default</Button>
              <Button variant="destructive" size="small">
                Destructive
              </Button>
              <Button variant="outline" size="small">
                Outline
              </Button>
              <Button variant="secondary" size="small">
                Secondary
              </Button>
              <Button variant="ghost" size="small">
                Ghost
              </Button>
              <Button variant="link" size="small">
                Link
              </Button>
              <Button size="small" iconRight={<ArrowRight />}>
                With right icon
              </Button>
              <Button size="small" iconLeft={<ArrowRight />}>
                With left icon
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
