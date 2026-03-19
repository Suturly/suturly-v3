import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getPayload } from 'payload'
import path from 'path'
import { promises as fs } from 'fs'
import config from '@payload-config'
import type { Media } from '@/payload-types'

const REQUIRED_ENV_VARS = ['R2_BUCKET', 'R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY'] as const

const ensureEnv = () => {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]?.trim())
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`)
  }
}

const isTruthy = (value?: string) => value?.toLowerCase() === 'true'

const fileExists = async (absolutePath: string): Promise<boolean> => {
  try {
    await fs.access(absolutePath)
    return true
  } catch {
    return false
  }
}

const collectDocFilenames = (doc: Media): string[] => {
  const names = new Set<string>()

  if (doc.filename) names.add(doc.filename)

  if (doc.sizes) {
    for (const size of Object.values(doc.sizes)) {
      if (size?.filename) names.add(size.filename)
    }
  }

  return [...names]
}

const objectExistsInR2 = async (
  s3: S3Client,
  bucket: string,
  key: string,
): Promise<boolean> => {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    return true
  } catch {
    return false
  }
}

const run = async () => {
  ensureEnv()

  const bucket = process.env.R2_BUCKET!
  const accountId = process.env.R2_ACCOUNT_ID!
  const accessKeyId = process.env.R2_ACCESS_KEY_ID!
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!
  const overwrite = isTruthy(process.env.R2_MIGRATION_OVERWRITE)
  const dryRun = isTruthy(process.env.R2_MIGRATION_DRY_RUN)

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })

  const payload = await getPayload({ config })
  const localMediaDir = path.resolve(process.cwd(), 'public/media')

  let page = 1
  const limit = 100
  let uploaded = 0
  let skippedExisting = 0
  let skippedMissingLocal = 0
  let checked = 0

  while (true) {
    const result = await payload.find({
      collection: 'media',
      depth: 0,
      page,
      limit,
      overrideAccess: true,
    })

    for (const doc of result.docs as Media[]) {
      const filenames = collectDocFilenames(doc)

      for (const filename of filenames) {
        checked += 1
        const localFilePath = path.join(localMediaDir, filename)
        const hasLocalFile = await fileExists(localFilePath)

        if (!hasLocalFile) {
          skippedMissingLocal += 1
          payload.logger.warn(`[r2-migrate] Local file missing: ${filename}`)
          continue
        }

        const existsRemotely = await objectExistsInR2(s3, bucket, filename)
        if (existsRemotely && !overwrite) {
          skippedExisting += 1
          continue
        }

        if (dryRun) {
          payload.logger.info(`[r2-migrate] DRY_RUN upload: ${filename}`)
          uploaded += 1
          continue
        }

        const body = await fs.readFile(localFilePath)

        await s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: filename,
            Body: body,
            ContentType: doc.mimeType || undefined,
          }),
        )

        uploaded += 1
      }
    }

    if (!result.hasNextPage) break
    page += 1
  }

  payload.logger.info(
    `[r2-migrate] Done. checked=${checked} uploaded=${uploaded} skippedExisting=${skippedExisting} skippedMissingLocal=${skippedMissingLocal} dryRun=${dryRun} overwrite=${overwrite}`,
  )
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[r2-migrate] Failed:', error)
    process.exit(1)
  })
