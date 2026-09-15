import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getMaterialTransfers } from './apiMaterialTransfers'

const { from, ordersIn, range } = vi.hoisted(() => ({
  from: vi.fn(),
  ordersIn: vi.fn(),
  range: vi.fn(),
}))

vi.mock('./supabase', () => ({ default: { from } }))

describe('material transfer order appearance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    from.mockImplementation((table: string) =>
      table === 'sales_orders'
        ? { select: () => ({ in: ordersIn }) }
        : { select: () => ({ order: () => ({ range }) }) },
    )
  })

  it('matches appearance by project number and preserves unmatched transfers', async () => {
    range.mockResolvedValue({
      data: [
        { id: '1', project_no: ' P1 ' },
        { id: '2', project_no: 'P2' },
      ],
      count: 2,
      error: null,
    })
    ordersIn.mockResolvedValue({
      data: [
        { project_no: 'P1', product_category: '氧化', color_name: '银白' },
      ],
      error: null,
    })

    const result = await getMaterialTransfers({ page: 1, pageSize: 20 })

    expect(result.items).toMatchObject([
      { id: '1', product_category: '氧化', color_name: '银白' },
      { id: '2', product_category: null, color_name: null },
    ])
    expect(result.total).toBe(2)
    expect(ordersIn).toHaveBeenCalledWith('project_no', ['P1', 'P2'])
  })

  it('skips the order lookup for an empty list', async () => {
    range.mockResolvedValue({ data: [], count: 0, error: null })

    const result = await getMaterialTransfers({ page: 1, pageSize: 20 })

    expect(result.items).toEqual([])
    expect(ordersIn).not.toHaveBeenCalled()
  })

  it('reports order lookup errors instead of silently displaying empty values', async () => {
    range.mockResolvedValue({
      data: [{ id: '1', project_no: 'P1' }],
      count: 1,
      error: null,
    })
    ordersIn.mockResolvedValue({
      data: null,
      error: { message: 'lookup failed' },
    })

    await expect(
      getMaterialTransfers({ page: 1, pageSize: 20 }),
    ).rejects.toThrow()
  })
})
