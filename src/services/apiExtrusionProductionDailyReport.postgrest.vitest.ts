import { beforeEach, describe, expect, it, vi } from 'vitest'

const requests = vi.hoisted(() => ({ urls: [] as string[] }))

vi.mock('./supabase', async () => {
  const { createClient } = await import('@supabase/supabase-js')
  const client = createClient(
    'https://example.supabase.co',
    'sb_publishable_test',
    {
      global: {
        fetch: async (input) => {
          requests.urls.push(String(input))
          return new Response('[]', {
            status: 200,
            headers: {
              'content-range': '*/0',
              'content-type': 'application/json',
            },
          })
        },
      },
    },
  )

  return { default: client }
})

import {
  getExtrusionProductionDailyReport,
  getExtrusionProductionDailyReportForExport,
} from './apiExtrusionProductionDailyReport'

const EXPECTED_TOP_LEVEL_ORDER =
  'extrusion_productions(production_date).desc,' +
  'extrusion_productions(id).asc,' +
  'sort_order.asc,id.asc'

describe('extrusion production daily report PostgREST request', () => {
  beforeEach(() => {
    requests.urls.length = 0
  })

  it('orders paginated rows by the to-one relation at the top level', async () => {
    await getExtrusionProductionDailyReport({ page: 2, pageSize: 10 })

    const url = new URL(requests.urls[0])
    expect(url.searchParams.get('order')).toBe(EXPECTED_TOP_LEVEL_ORDER)
    expect(url.searchParams.has('extrusion_productions.order')).toBe(false)
    expect(url.searchParams.get('offset')).toBe('10')
    expect(url.searchParams.get('limit')).toBe('10')
  })

  it('uses the same top-level relation order for exports', async () => {
    await getExtrusionProductionDailyReportForExport()

    const url = new URL(requests.urls[0])
    expect(url.searchParams.get('order')).toBe(EXPECTED_TOP_LEVEL_ORDER)
    expect(url.searchParams.has('extrusion_productions.order')).toBe(false)
    expect(url.searchParams.get('offset')).toBe('0')
    expect(url.searchParams.get('limit')).toBe('1000')
  })
})
