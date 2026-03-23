import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  isResourcesGateEnabled,
  verifyResourcesGateToken,
} from '@/lib/resourcesGateToken'

export async function middleware(request: NextRequest) {
  if (!isResourcesGateEnabled()) {
    return NextResponse.next()
  }

  const token = request.cookies.get('resources_gate')?.value
  if (token && (await verifyResourcesGateToken(token))) {
    return NextResponse.next()
  }

  const pathname = request.nextUrl.pathname
  const search = request.nextUrl.search
  const next = `${pathname}${search}`
  const gateUrl = new URL('/resources-gate', request.url)
  gateUrl.searchParams.set('next', next)
  return NextResponse.redirect(gateUrl)
}

export const config = {
  matcher: ['/resources', '/resources/:path*'],
}
