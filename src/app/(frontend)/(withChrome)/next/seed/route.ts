import { createLocalReq, getPayload } from 'payload'
import { seed } from '@/endpoints/seed'
import config from '@payload-config'
import { headers } from 'next/headers'

export const maxDuration = 60 // This function can run for a maximum of 60 seconds

/**
 * Seeding **deletes** most collections and re-inserts demo data. It must not run against
 * production by accident. In `NODE_ENV=production`, POST is rejected unless
 * `ALLOW_DATABASE_SEED=true` (only for a disposable DB you intend to wipe).
 */
export async function POST(): Promise<Response> {
  const seedAllowedInProduction = process.env.ALLOW_DATABASE_SEED === 'true'
  if (process.env.NODE_ENV === 'production' && !seedAllowedInProduction) {
    return Response.json(
      {
        error:
          'Database seeding is disabled in production. It deletes posts, pages, forms, media rows, and more. Deploys do not run this — only an explicit POST to /next/seed does. To allow seeding on a throwaway database, set ALLOW_DATABASE_SEED=true.',
      },
      { status: 403 },
    )
  }

  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  // Authenticate by passing request headers
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    return new Response('Action forbidden.', { status: 403 })
  }

  try {
    // Create a Payload request object to pass to the Local API for transactions
    // At this point you should pass in a user, locale, and any other context you need for the Local API
    const payloadReq = await createLocalReq({ user }, payload)

    await seed({ payload, req: payloadReq })

    return Response.json({ success: true })
  } catch (e) {
    payload.logger.error({ err: e, message: 'Error seeding data' })
    return new Response('Error seeding data.', { status: 500 })
  }
}
