import { test, expect } from '@playwright/test'

import { login } from '../helpers/login'
import { cleanupTestUser, seedTestUser, testUser } from '../helpers/seedUser'

test.describe('Resources admin draft save', () => {
  test.beforeAll(async () => {
    await seedTestUser()
  })

  test.afterAll(async () => {
    await cleanupTestUser()
  })

  test('explicit Save Draft finishes without hanging', async ({ page }) => {
    test.setTimeout(180_000)

    await login({ page, user: testUser })

    await page.goto('http://localhost:3000/admin/collections/posts/create')

    await expect(page.locator('input[name="title"]').first()).toBeVisible({ timeout: 120_000 })

    await page.locator('input[name="title"]').first().fill(`Playwright draft ${Date.now()}`)

    const note = page.locator('textarea[name="note"]')
    if ((await note.count()) > 0) await note.fill('e2e')

    const saveResponse = page.waitForResponse(
      (r) =>
        r.url().includes('/api/') &&
        r.url().includes('posts') &&
        ['PATCH', 'POST'].includes(r.request().method()) &&
        r.ok(),
      { timeout: 120_000 },
    )

    await page.getByRole('button', { name: /save draft/i }).first().click()

    await saveResponse

    await expect
      .poll(async () => page.getByText(/^Submitting/i).count(), {
        timeout: 90_000,
        intervals: [100, 250, 500, 1000],
      })
      .toBe(0)
  })
})
