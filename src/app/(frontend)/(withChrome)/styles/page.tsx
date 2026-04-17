import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'
import { ArrowRight, Mail } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Styles',
  description: 'Global design tokens: typography, colors, and UI buttons.',
  robots: {
    index: false,
    follow: false,
  },
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-6">
      <h2 className="border-border border-b pb-2 text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {children}
    </section>
  )
}

function TokenLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1 font-mono text-[11px] text-muted-foreground leading-snug">{children}</p>
  )
}

function ColorSwatch({
  name,
  bgClass,
  fgClass = 'u-color-gray-900',
}: {
  name: string
  bgClass: string
  fgClass?: string
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div
        className={cn('flex h-14 items-end rounded-md border border-border p-2', bgClass)}
        title={name}
      >
        <span className={cn('truncate text-caption-p', fgClass)}>Aa</span>
      </div>
      <span className="truncate font-mono text-[11px] text-muted-foreground">{name}</span>
    </div>
  )
}

function ColorRow({
  label,
  swatches,
}: {
  label: string
  swatches: { name: string; bg: string; fg?: string }[]
}) {
  return (
    <div className="space-y-3">
      <p className="text-p-sm font-medium text-foreground">{label}</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-7">
        {swatches.map(({ name, bg, fg }) => (
          <ColorSwatch key={name} name={name} bgClass={bg} fgClass={fg} />
        ))}
      </div>
    </div>
  )
}

const PRIMARY_SCALE: { name: string; bg: string; fg?: string }[] = [
  { name: 'primary-50', bg: 'u-bg-primary-50' },
  { name: 'primary-100', bg: 'u-bg-primary-100' },
  { name: 'primary-200', bg: 'u-bg-primary-200' },
  { name: 'primary-400', bg: 'u-bg-primary-400', fg: 'u-color-primary-1000' },
  { name: 'primary-600', bg: 'u-bg-primary-600', fg: 'u-color-primary-50' },
  { name: 'primary-800', bg: 'u-bg-primary-800', fg: 'u-color-primary-50' },
  { name: 'primary-1000', bg: 'u-bg-primary-1000', fg: 'u-color-primary-50' },
]

const SECONDARY_SCALE: { name: string; bg: string; fg?: string }[] = [
  { name: 'secondary-100', bg: 'u-bg-secondary-100' },
  { name: 'secondary-500', bg: 'u-bg-secondary-500', fg: 'u-color-primary-50' },
]

const ACCENT_SCALE: { name: string; bg: string; fg?: string }[] = [
  { name: 'accent-700', bg: 'u-bg-accent-700', fg: 'u-color-primary-50' },
  { name: 'accent-800', bg: 'u-bg-accent-800', fg: 'u-color-primary-50' },
]

const DANGER_SCALE: { name: string; bg: string; fg?: string }[] = [
  { name: 'danger-25', bg: 'u-bg-danger-25' },
  { name: 'danger-700', bg: 'u-bg-danger-700', fg: 'u-color-primary-50' },
]

const GRAY_SCALE: { name: string; bg: string; fg?: string }[] = [
  { name: 'gray-30', bg: 'u-bg-gray-30' },
  { name: 'gray-50', bg: 'u-bg-gray-50' },
  { name: 'gray-100', bg: 'u-bg-gray-100' },
  { name: 'gray-500', bg: 'u-bg-gray-500', fg: 'u-color-primary-50' },
  { name: 'gray-900', bg: 'u-bg-gray-900', fg: 'u-color-primary-50' },
]

export default function StylesPage() {
  return (
    <main className="bg-background py-16 md:py-24">
      <div className="container max-w-5xl space-y-20">
        <header className="space-y-2">
          <p className="text-caption-h text-muted-foreground uppercase tracking-wide">Design system</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Styles</h1>
          <p className="text-p-main max-w-2xl text-muted-foreground">
            Global tokens from <code className="rounded bg-muted px-1 py-0.5 text-p-sm">tokens.css</code>{' '}
            and shared UI primitives. Marketing-only sections (tabs, evidence blocks, etc.) are not listed
            here.
          </p>
        </header>

        <Section title="Typography — scale (classes)">
          <p className="text-p-sm text-muted-foreground">
            Headings use component classes from the global stylesheet (<code className="text-p-sm">.h1</code>{' '}
            … <code className="text-p-sm">.h6</code>). Body copy uses <code className="text-p-sm">p</code> /{' '}
            <code className="text-p-sm">.paragraph</code>, <code className="text-p-sm">.p-sm</code>,{' '}
            <code className="text-p-sm">.p-18</code>, <code className="text-p-sm">.eyebrow</code>.
          </p>
          <div className="max-w-3xl space-y-6 border-border border rounded-lg bg-card p-6">
            <div>
              <div className="h1">Heading one</div>
              <TokenLabel>.h1</TokenLabel>
            </div>
            <div>
              <div className="h2">Heading two</div>
              <TokenLabel>.h2</TokenLabel>
            </div>
            <div>
              <div className="h3">Heading three</div>
              <TokenLabel>.h3</TokenLabel>
            </div>
            <div>
              <div className="h4">Heading four</div>
              <TokenLabel>.h4</TokenLabel>
            </div>
            <div>
              <div className="h5">Heading five</div>
              <TokenLabel>.h5</TokenLabel>
            </div>
            <div>
              <div className="h6">Heading six</div>
              <TokenLabel>.h6</TokenLabel>
            </div>
            <div>
              <p>Paragraph — main body text. The quick brown fox jumps over the lazy dog.</p>
              <TokenLabel>p / .paragraph</TokenLabel>
            </div>
            <div>
              <p className="p-sm">Small paragraph for secondary UI copy.</p>
              <TokenLabel>.p-sm</TokenLabel>
            </div>
            <div>
              <p className="p-18">18px layout paragraph where used.</p>
              <TokenLabel>.p-18</TokenLabel>
            </div>
            <div>
              <p className="eyebrow">Eyebrow / overline</p>
              <TokenLabel>.eyebrow</TokenLabel>
            </div>
          </div>
        </Section>

        <Section title="Typography — token utilities">
          <p className="text-p-sm text-muted-foreground">
            Utility classes mapped to <code className="text-p-sm">@theme</code> text tokens (see{' '}
            <code className="text-p-sm">product.css</code>).
          </p>
          <div className="max-w-3xl space-y-4 border-border border rounded-lg bg-card p-6">
            <p className="text-p-main">text-p-main — 16px body</p>
            <p className="text-p-sm">text-p-sm — 14px</p>
            <p className="text-p-nav">text-p-nav — navigation emphasis</p>
            <p className="text-caption-h uppercase tracking-wide">text-caption-h — caption heading</p>
            <p className="text-caption-p">text-caption-p — caption body</p>
            <div className="flex flex-wrap gap-4 border-border border-t pt-4">
              <span className="u-weight-regular">u-weight-regular</span>
              <span className="u-weight-medium">u-weight-medium</span>
              <span className="u-weight-semibold">u-weight-semibold</span>
              <span className="u-weight-bold">u-weight-bold</span>
            </div>
          </div>
        </Section>

        <Section title="Colors — Suturly palette">
          <p className="text-p-sm text-muted-foreground">
            One row per family. Use <code className="text-p-sm">u-bg-*</code> / <code className="text-p-sm">u-color-*</code>{' '}
            from <code className="text-p-sm">tokens.css</code>.
          </p>
          <div className="space-y-10">
            <ColorRow label="Primary" swatches={PRIMARY_SCALE} />
            <ColorRow label="Secondary" swatches={SECONDARY_SCALE} />
            <ColorRow label="Accent" swatches={ACCENT_SCALE} />
            <ColorRow label="Danger" swatches={DANGER_SCALE} />
            <ColorRow label="Gray" swatches={GRAY_SCALE} />
          </div>
        </Section>

        <Section title="Buttons">
          <div className="space-y-10">
            <div className="space-y-3">
              <p className="text-p-sm text-muted-foreground">
                Standard size (omit <code className="text-p-sm">size</code> — same as{' '}
                <code className="text-p-sm">size=&quot;big&quot;</code> in code).
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button>Default</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-p-sm text-muted-foreground">Small</p>
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
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-p-sm text-muted-foreground">
                Icons — <code className="text-p-sm">iconLeft</code> / <code className="text-p-sm">iconRight</code> work with any{' '}
                <code className="text-p-sm">variant</code> and <code className="text-p-sm">size</code>.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button iconRight={<ArrowRight aria-hidden />}>Primary</Button>
                <Button variant="outline" iconLeft={<ArrowRight aria-hidden />}>
                  Outline
                </Button>
                <Button variant="secondary" size="small" iconRight={<ArrowRight aria-hidden />}>
                  Secondary small
                </Button>
                <Button variant="ghost" size="small" iconLeft={<ArrowRight aria-hidden />}>
                  Ghost small
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-p-sm text-muted-foreground">
                <code className="text-p-sm">href</code> — same <code className="text-p-sm">Button</code>; renders a real{' '}
                <code className="text-p-sm">&lt;a&gt;</code> for <code className="text-p-sm">mailto:</code>,{' '}
                <code className="text-p-sm">tel:</code>, or external URLs. Use any variant (the footer email uses{' '}
                <code className="text-p-sm">secondary</code> — not a separate component).
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button href="mailto:hello@suturly.com">Primary email</Button>
                <Button href="mailto:hello@suturly.com" variant="secondary" iconLeft={<Mail aria-hidden />}>
                  hello@suturly.com
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-p-sm text-muted-foreground">
                In-app routes — <code className="text-p-sm">asChild</code> + Next.js <code className="text-p-sm">Link</code>{' '}
                (prefetch, client navigation).
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild>
                  <Link href="/resources">Browse resources</Link>
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-p-sm text-muted-foreground">Disabled</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button disabled>Default</Button>
                <Button variant="outline" disabled>
                  Outline
                </Button>
                <Button variant="secondary" disabled>
                  Secondary
                </Button>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </main>
  )
}
