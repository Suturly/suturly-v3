/**
 * One-time: set role = 'admin' for every user in the database.
 *
 * Usage (from repo root, with DATABASE_URL + PAYLOAD_SECRET in env):
 *   pnpm exec tsx src/scripts/grantAllUsersAdmin.ts
 *
 * Or: npm run users:grant-admin
 */
import config from '@payload-config'
import { getPayload } from 'payload'

async function main() {
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 5000,
    pagination: false,
    overrideAccess: true,
  })

  let updated = 0
  for (const doc of result.docs) {
    if (doc.role === 'admin') continue
    await payload.update({
      collection: 'users',
      id: doc.id,
      data: { role: 'admin' },
      overrideAccess: true,
    })
    updated += 1
    payload.logger.info(`[grant-admin] user id=${doc.id} email=${doc.email} -> admin`)
  }

  payload.logger.info(`[grant-admin] Done. Total users=${result.docs.length}, updated=${updated}`)
  process.exit(0)
}

main().catch((error) => {
  console.error('[grant-admin] Failed:', error)
  process.exit(1)
})
