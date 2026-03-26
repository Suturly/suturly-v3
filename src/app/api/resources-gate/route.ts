import { NextResponse } from 'next/server'
import {
  createResourcesGateToken,
  isResourcesGateEnabled,
  RESOURCES_GATE_COOKIE_NAME,
  resourcesGateCookieMaxAge,
} from '@/lib/resourcesGateToken'

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return '/resources'
  }
  return next
}

/**
 * JSON-only responses (no redirects): POST-redirect-GET via Location would default to 307 in Next.js,
 * which preserves POST on follow-up and causes 405 on page routes. Client navigates with GET after success.
 */
export async function POST(request: Request) {
  if (!isResourcesGateEnabled()) {
    return NextResponse.json({ ok: false as const, error: 'not_configured' }, { status: 400 })
  }

  let password = ''
  let nextPath = '/resources'

  const contentType = request.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    try {
      const body = (await request.json()) as { password?: string; next?: string }
      password = typeof body.password === 'string' ? body.password : ''
      nextPath = safeNextPath(typeof body.next === 'string' ? body.next : null)
    } catch {
      return NextResponse.json({ ok: false as const, error: 'invalid_json' }, { status: 400 })
    }
  } else {
    const form = await request.formData()
    password = typeof form.get('password') === 'string' ? (form.get('password') as string) : ''
    nextPath = safeNextPath(typeof form.get('next') === 'string' ? (form.get('next') as string) : null)
  }

  const expected = process.env.RESOURCES_GATE_PASSWORD || ''
  if (!password || password !== expected) {
    return NextResponse.json({ ok: false as const, error: 'invalid_password' }, { status: 401 })
  }

  const token = await createResourcesGateToken()
  const res = NextResponse.json({ ok: true as const, next: nextPath }, { status: 200 })
  const isProd = process.env.NODE_ENV === 'production'
  res.cookies.set(RESOURCES_GATE_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: resourcesGateCookieMaxAge(),
  })
  return res
}
