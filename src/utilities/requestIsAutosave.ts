import type { PayloadRequest } from 'payload'

/** Payload passes `autosave` on REST draft/autosave updates — skip expensive hooks to avoid overlapping saves. */
export function requestIsAutosave(req: PayloadRequest): boolean {
  const a = req.query?.autosave
  return a === true || a === 'true'
}
