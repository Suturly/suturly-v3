import { resolveReferenceTitles } from '@/utilities/referenceMeta'
import { NextResponse } from 'next/server'

type RequestBody = {
  hrefs?: unknown
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody
    const hrefs = Array.isArray(body.hrefs)
      ? body.hrefs.filter((item): item is string => typeof item === 'string')
      : []

    if (hrefs.length === 0) {
      return NextResponse.json({ titles: {} })
    }

    const titles = await resolveReferenceTitles(hrefs)
    return NextResponse.json({ titles })
  } catch {
    return NextResponse.json({ titles: {} })
  }
}
