import { test, expect } from '@playwright/test'

test.describe('E2E User Flows', () => {
  test('success path: results by analysis id', async ({ page }) => {
    const res = await page.request.get('/api/analysis/submit')
    const json = await res.json()
    const id = json.id as string
    await page.goto(`/results?id=${encodeURIComponent(id)}`)
    await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Measurements' })).toBeVisible()
  })

  test('PDF export', async ({ page }) => {
    const res = await page.request.get('/api/analysis/submit')
    const json = await res.json()
    const id = json.id as string
    await page.goto(`/results?id=${encodeURIComponent(id)}`)
    const [ download ] = await Promise.all([
      page.waitForEvent('download'),
      page.click(`a[href^="/api/export/pdf?id=${id}"]`),
    ])
    const name = await download.suggestedFilename()
    expect(name).toContain('analysis-')
  })

  test('results API returns imagery and overlay', async ({ page }) => {
    const res = await page.request.get('/api/analysis/submit')
    const json = await res.json()
    const id = json.id as string
    let data: any = null
    const start = Date.now()
    while (Date.now() - start < 30000) {
      const api = await page.request.get(`/api/analysis/results?id=${encodeURIComponent(id)}`)
      data = await api.json()
      if (data?.imagery?.url && Array.isArray(data?.overlay?.polygons) && data.overlay.polygons.length > 0) break
      await page.waitForTimeout(800)
    }
    expect(String(data?.imagery?.url || '')).not.toHaveLength(0)
    expect(Array.isArray(data?.overlay?.polygons)).toBeTruthy()
    expect((data?.overlay?.polygons || []).length).toBeGreaterThan(0)
  })
})

