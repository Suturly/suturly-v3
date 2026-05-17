import type { Field, PayloadComponent } from 'payload'

const TRANSLATABLE_TYPES = new Set<string>(['text', 'textarea', 'richText'])

/**
 * Phase 5 stale-outline + “Reset to English” wraps only **text** and **textarea**.
 * Do **not** wrap `richText` (Lexical) via `admin.components.Field`: that breaks nested array
 * editors. Category Sections → **Content** uses {@link StaleLocalizedRichTextResetBeforeInput}
 * (`beforeInput`) instead so Lexical mounts normally with a reset row above it.
 */
const STALE_FIELD_WRAPPER_TYPES = new Set<string>(['text', 'textarea'])

const STALE_LOCALIZED_FIELD_PATH =
  '@/collections/Resources/components/StaleLocalizedField.client#StaleLocalizedField' as const

/**
 * Recursively walks a field tree and marks every text/textarea/richText field
 * as `localized: true`. Used to opt the Resources collection (the only
 * EN/ES-localized collection in this project) into Payload's per-field
 * localization without listing every field by hand.
 *
 * For every localized **text** and **textarea** leaf, it also swaps in the
 * Phase 5 admin wrapper (`StaleLocalizedField`) so editors see stale-state
 * outlines and a per-field “Reset to English” on Spanish (Lexical uses `beforeInput` — see above).
 * Existing custom `admin.components.Field` values (SlugField, SEO meta fields,
 * citation key picker) are passed through as `innerField` client props so the
 * wrapper composes instead of replacing those UIs.
 *
 * Fields that already have an explicit `localized` value (true OR false) are
 * left untouched — set `localized: false` directly on a field to keep it as a
 * single shared value (e.g. internal editor notes, UUID keys, derived data).
 *
 * Container fields (array, group, collapsible, row, tabs, blocks) are walked
 * recursively. Note that blocks embedded inside a localized richText field
 * don't actually need their inner fields marked localized — the entire
 * richText JSON tree is stored per-locale by virtue of the parent — so this
 * helper's `blocks` recursion is mostly a no-op for richText-embedded blocks
 * but still correct for top-level `blocks`-typed fields with their own tables.
 */
export const markLocalized = (fields: Field[]): Field[] =>
  fields.map((field) => {
    const next = { ...field } as Field

    if (TRANSLATABLE_TYPES.has(next.type as string) && !('localized' in next)) {
      ;(next as { localized?: boolean }).localized = true
    }

    if (next.type === 'array' || next.type === 'group' || next.type === 'collapsible') {
      ;(next as { fields: Field[] }).fields = markLocalized(
        (next as { fields: Field[] }).fields,
      )
    }
    if (next.type === 'row') {
      next.fields = markLocalized(next.fields)
    }
    if (next.type === 'tabs') {
      next.tabs = next.tabs.map((tab) => ({ ...tab, fields: markLocalized(tab.fields) }))
    }
    if (next.type === 'blocks') {
      next.blocks = next.blocks.map((block) => ({
        ...block,
        fields: markLocalized(block.fields),
      }))
    }

    if (
      STALE_FIELD_WRAPPER_TYPES.has(next.type as string) &&
      (next as { localized?: boolean }).localized === true
    ) {
      const existing = next.admin?.components?.Field as PayloadComponent | undefined
      next.admin = {
        ...(next.admin ?? {}),
        components: {
          ...(next.admin?.components ?? {}),
          Field: existing
            ? {
                path: STALE_LOCALIZED_FIELD_PATH,
                clientProps: { innerField: existing },
              }
            : STALE_LOCALIZED_FIELD_PATH,
        },
      } as Field['admin']
    }

    return next
  })
