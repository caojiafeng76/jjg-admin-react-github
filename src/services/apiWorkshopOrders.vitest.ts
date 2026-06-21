import { describe, expect, it, vi } from 'vitest'

vi.mock('./supabase', () => ({
  default: {},
}))

import { buildWorkshopOrderStatusUpdateValues } from './apiWorkshopOrders'

describe('buildWorkshopOrderStatusUpdateValues', () => {
  it('sets closed_at when an order is closed', () => {
    const now = new Date('2026-06-21T09:10:11.000Z')

    expect(buildWorkshopOrderStatusUpdateValues('已结案', now)).toEqual({
      status: '已结案',
      closed_at: '2026-06-21T09:10:11.000Z',
    })
  })

  it('uses the clicked time supplied by the caller when an order is closed', () => {
    expect(
      buildWorkshopOrderStatusUpdateValues(
        '已结案',
        '2026-06-21T09:10:11.123Z',
      ),
    ).toEqual({
      status: '已结案',
      closed_at: '2026-06-21T09:10:11.123Z',
    })
  })

  it('clears closed_at when an order returns to production', () => {
    const now = new Date('2026-06-21T09:10:11.000Z')

    expect(buildWorkshopOrderStatusUpdateValues('生产中', now)).toEqual({
      status: '生产中',
      closed_at: null,
    })
  })
})
