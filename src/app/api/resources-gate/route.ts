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

export async function POST(request: Request) {
  if (!isResourcesGateEnabled()) {
    return NextResponse.json({ error: 'Gate is not configured' }, { status: 400 })
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
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
  } else {
    const form = await request.formData()
    password = typeof form.get('password') === 'string' ? (form.get('password') as string) : ''
    nextPath = safeNextPath(typeof form.get('next') === 'string' ? (form.get('next') as string) : null)
  }

  const expected = process.env.RESOURCES_GATE_PASSWORD || ''
  if (!password || password !== expected) {
    const url = new URL('/resources-gate', request.url)
    url.searchParams.set('next', nextPath)
    url.searchParams.set('error', '1')
    return NextResponse.redirect(url)
  }

  const token = await createResourcesGateToken()
  const redirectUrl = new URL(nextPath, request.url)
  const res = NextResponse.redirect(redirectUrl)
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
