/**
 * Signed cookie for /resources gate (Edge-safe).
 * Change password via RESOURCES_GATE_PASSWORD in env; old cookies become invalid when password changes.
 */

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days

function getSecret(): string {
  return process.env.RESOURCES_GATE_SECRET || process.env.PAYLOAD_SECRET || ''
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let out = 0
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return out === 0
}

/** When unset or empty, the gate is disabled (all /resources traffic allowed). */
export function isResourcesGateEnabled(): boolean {
  const p = process.env.RESOURCES_GATE_PASSWORD
  return typeof p === 'string' && p.length > 0
}

export const RESOURCES_GATE_COOKIE_NAME = 'resources_gate'

export async function createResourcesGateToken(): Promise<string> {
  const password = process.env.RESOURCES_GATE_PASSWORD || ''
  const secret = getSecret()
  if (!secret) {
    throw new Error('RESOURCES_GATE_SECRET or PAYLOAD_SECRET must be set when RESOURCES_GATE_PASSWORD is set')
  }
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS
  const sig = await hmacSha256Hex(secret, `${exp}:${password}`)
  return `${exp}.${sig}`
}

export async function verifyResourcesGateToken(token: string): Promise<boolean> {
  if (!isResourcesGateEnabled()) return true
  const secret = getSecret()
  if (!secret) return false
  const password = process.env.RESOURCES_GATE_PASSWORD || ''
  const parts = token.split('.')
  if (parts.length !== 2) return false
  const exp = parseInt(parts[0], 10)
  if (Number.isNaN(exp) || exp < Math.floor(Date.now() / 1000)) return false
  const expectedSig = await hmacSha256Hex(secret, `${exp}:${password}`)
  return timingSafeEqualHex(expectedSig, parts[1])
}

export function resourcesGateCookieMaxAge(): number {
  return MAX_AGE_SECONDS
}
