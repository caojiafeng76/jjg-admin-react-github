import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getTransferStatsByProjectNo } from './apiMaterialTransfers'

const { from, range } = vi.hoisted(() => ({
  from: vi.fn(),
  range: vi.fn(),
}))

vi.mock('./supabase', () => ({ default: { from } }))

describe('material transfer warehouse aggregation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    from.mockReturnValue({
      select: () => ({
        eq: () => ({
          order: () => ({ range }),
        }),
      }),
    })
  })

  it('同时将「仓库」与「凉亭仓库」计入 totalInWarehouse 并分别统计 byWorkshop', async () => {
    range.mockResolvedValue({
      data: [
        { target_workshop: '仓库', transfer_quantity: 12 },
        { target_workshop: '凉亭仓库', transfer_quantity: 8 },
        { target_workshop: '凉亭仓库', transfer_quantity: 5 },
        { target_workshop: '精加工', transfer_quantity: 20 },
      ],
      error: null,
    })

    const stats = await getTransferStatsByProjectNo(' P-2026-01 ')

    expect(stats.totalInWarehouse).toBe(25)
    expect(stats.totalOutbound).toBe(45)
    expect(stats.totalTransferred).toBe(45)
    expect(stats.byWorkshop).toEqual([
      { target_workshop: '仓库', total_quantity: 12, record_count: 1 },
      { target_workshop: '凉亭仓库', total_quantity: 13, record_count: 2 },
      { target_workshop: '精加工', total_quantity: 20, record_count: 1 },
    ])
  })

  it('数据库迁移为三张表及看板视图同步添加「凉亭仓库」', () => {
    const sql = readFileSync(
      resolve(
        process.cwd(),
        'supabase/migrations/20261122120000_add_liangting_warehouse_workshop.sql',
      ),
      'utf8',
    )

    expect(sql).toContain('material_transfers_target_workshop_check')
    expect(sql).toContain('precision_cutting_transfers_target_workshop_check')
    expect(sql).toContain('precision_finishing_cuttings_target_workshop_check')
    expect(sql).toContain('\'凉亭仓库\'')
    expect(sql).toContain('in (\'仓库\', \'凉亭仓库\')')
    expect(sql).toContain('with (security_invoker = true)')
  })
})
