import { describe, it, expect } from 'vitest'
import { POST as AnalyzePOST } from '../app/api/analyze/route'
import { GET as ResultsGET } from '../app/api/results/[id]/route'
import { GET as StatusGET } from '../app/api/analysis/status/route'
import { POST as AssistUploadPOST } from '../app/api/assist/upload/route'

describe('API Routes', () => {
  it('POST /api/analyze returns 202 with analysisId', async () => {
    const req = new Request('http://localhost/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: '123 Main St' }),
    })
    const res = await AnalyzePOST(req)
    expect(res.status).toBe(202)
    const json: any = await res.json()
    expect(json).toHaveProperty('analysisId')
  })

  it('POST /api/analyze returns 400 for missing address', async () => {
    const req = new Request('http://localhost/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await AnalyzePOST(req)
    expect(res.status).toBe(400)
  })

  it('GET /api/results/[id] returns 404 for unknown id', async () => {
    const res = await ResultsGET(new Request('http://localhost/api/results/unknown'), { params: { id: 'unknown' } })
    expect(res.status).toBe(404)
  })

  it('Flow: analyze → status → results (analysis present)', async () => {
    const submit = await AnalyzePOST(new Request('http://localhost/api/analyze', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: '456 Pine Ave' })
    }))
    const { analysisId } = await submit.json() as any

    const statusRes = await StatusGET(new Request(`http://localhost/api/analysis/status?id=${analysisId}`))
    expect(statusRes.status).toBe(200)
    const statusJson: any = await statusRes.json()
    expect(statusJson).toHaveProperty('status')

    const resultsRes = await ResultsGET(new Request(`http://localhost/api/results/${analysisId}`), { params: { id: analysisId } })
    expect(resultsRes.status).toBe(200)
    const resultsJson: any = await resultsRes.json()
    expect(resultsJson).toHaveProperty('analysis')
  })

  it('POST /api/assist/upload creates a photo', async () => {
    const submit = await AnalyzePOST(new Request('http://localhost/api/analyze', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: '789 Oak Blvd' })
    }))
    const { analysisId } = await submit.json() as any
    const res = await AssistUploadPOST(new Request('http://localhost/api/assist/upload', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: analysisId, url: 'data:image/png;base64,iVBORw0KGgo=' })
    }))
    expect(res.status).toBe(201)
    const json: any = await res.json()
    expect(json).toHaveProperty('analysisId')
  })

  it('POST /api/assist/upload returns 400 when id/url missing', async () => {
    const res = await AssistUploadPOST(new Request('http://localhost/api/assist/upload', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({})
    }))
    expect(res.status).toBe(400)
  })
})
