import type { DeliveryOrderBatchDeps, DeliveryOrderBatchSnapshot } from './deliveryOrderBatch'
import type { SyneySafePartDetailPlanItem } from '@/services/syneyDeliveryOrderContract'
import { describe, expect, it, vi } from 'vitest'

import { describeError, runDeliveryOrderBatch, uniquePoNos } from './deliveryOrderBatch'

function planItem(SafePartNo: string): SyneySafePartDetailPlanItem {
  return {
    SaftPartID: 1,
    SupplierCode: 'S001',
    SupplierName: '供应商',
    SONo: 'SO1',
    PartNo: 'XN1',
    SafePartNo,
    SafePartModel: 'M',
    PartNameType: '梯级',
    SafePartFCDate: '2026-10-30',
  }
}

function createDeps(calls: string[], overrides: Partial<DeliveryOrderBatchDeps> = {}) {
  const deps: DeliveryOrderBatchDeps = {
    loadSafePartSources: vi.fn(async () => {
      calls.push('load')
      return new Map([['P1', [{ SONo: 'SO1', PartNo: 'XN1', partCode: 'A', partModel: 'M', partName: '梯级', date: '2026-10-30' }]]])
    }),
    createDeliveryOrder: vi.fn(async (poNo: string) => {
      calls.push(`create:${poNo}`)
      const id = Number(poNo.slice(1))
      return { deliveryOrderId: id, deliveryNo: `D${id}`, lineCount: 1, reused: false, hasSafeParts: true }
    }),
    planSafeParts: vi.fn(async (deliveryNo: string) => {
      calls.push(`plan:${deliveryNo}`)
      return { items: [planItem(`${deliveryNo}-1`), planItem(`${deliveryNo}-2`)], skipped: 1, rowCount: 1, warnings: [] }
    }),
    addSafePartDetail: vi.fn(async (item: SyneySafePartDetailPlanItem) => {
      calls.push(`add:${item.SafePartNo}`)
      return { skipped: false, message: '保存成功' }
    }),
    confirmDeliveryOrder: vi.fn(async (_id: number, deliveryNo: string) => {
      calls.push(`confirm:${deliveryNo}`)
      return { alreadyConfirmed: false, message: '确认成功' }
    }),
    markPosDelivered: vi.fn(async (poNo: string, deliveryNo: string) => {
      calls.push(`mark:${poNo}:${deliveryNo}`)
    }),
    printDeliveryOrders: vi.fn(async (ids: number[], nos: string[]) => {
      calls.push(`print:${ids.join(',')}:${nos.join(',')}`)
      return { fileName: '送货单.xls', blob: new Blob(['x']) }
    }),
    downloadFile: vi.fn((fileName: string) => {
      calls.push(`download:${fileName}`)
    }),
    ...overrides,
  }
  return deps
}

describe('uniquePoNos', () => {
  it('dedupes, trims and drops empty / literal null values', () => {
    expect(uniquePoNos(['P1', ' P1 ', 'null', '', null, 'P2'])).toEqual(['P1', 'P2'])
  })
})

describe('runDeliveryOrderBatch', () => {
  it('skips filling safe parts when SCM marks no line as a safe part', async () => {
    const calls: string[] = []
    const deps = createDeps(calls, {
      createDeliveryOrder: vi.fn(async (poNo: string) => {
        calls.push(`create:${poNo}`)
        return { deliveryOrderId: 1, deliveryNo: 'D1', lineCount: 1, reused: false, hasSafeParts: false }
      }),
    })

    const result = await runDeliveryOrderBatch({ poNos: ['P1'], deps, onUpdate: () => {} })

    expect(calls).toEqual(['load', 'create:P1', 'confirm:D1', 'mark:P1:D1', 'print:1:D1', 'download:送货单.xls'])
    expect(deps.planSafeParts).not.toHaveBeenCalled()
    expect(result.orders[0]).toMatchObject({
      status: 'success',
      safePartSkipped: true,
      steps: { create: 'finish', safeParts: 'finish', confirm: 'finish', writeBack: 'finish' },
    })
    // 本系统按件号配置仍识别出 1 条，提示核对
    expect(result.orders[0].warnings).toEqual([expect.stringContaining('本系统按件号配置识别到 1 条')])
  })

  it('runs every step strictly in sequence and prints once at the end', async () => {
    const calls: string[] = []
    const deps = createDeps(calls)
    const snapshots: DeliveryOrderBatchSnapshot[] = []

    const result = await runDeliveryOrderBatch({
      poNos: ['P1', 'P2'],
      deps,
      onUpdate: snapshot => snapshots.push(snapshot),
    })

    expect(calls).toEqual([
      'load',
      'create:P1',
      'plan:D1',
      'add:D1-1',
      'add:D1-2',
      'confirm:D1',
      'mark:P1:D1',
      'create:P2',
      'plan:D2',
      'add:D2-1',
      'add:D2-2',
      'confirm:D2',
      'mark:P2:D2',
      'print:1,2:D1,D2',
      'download:送货单.xls',
    ])
    expect(deps.planSafeParts).toHaveBeenCalledWith('D1', [expect.objectContaining({ partCode: 'A' })])
    expect(deps.planSafeParts).toHaveBeenCalledWith('D2', [])
    expect(result.orders.map(order => order.status)).toEqual(['success', 'success'])
    expect(result.orders[0]).toMatchObject({ safePartDone: 3, safePartTotal: 3, deliveryNo: 'D1' })
    expect(result.print).toEqual({ status: 'finish', fileName: '送货单.xls' })
    expect(result.file?.fileName).toBe('送货单.xls')

    // 进度快照里能看到「填写安全部件 2/3」这样的中间状态
    expect(
      snapshots.some(snapshot =>
        snapshot.orders[0].steps.safeParts === 'process' && snapshot.orders[0].safePartDone === 2,
      ),
    ).toBe(true)
  })

  it('records the failing step, continues with the next order and prints only successes', async () => {
    const calls: string[] = []
    const deps = createDeps(calls, {
      confirmDeliveryOrder: vi.fn(async (_id: number, deliveryNo: string) => {
        calls.push(`confirm:${deliveryNo}`)
        if (deliveryNo === 'D1')
          throw new Error('明细物料不能为空')
        return { alreadyConfirmed: false, message: '确认成功' }
      }),
    })

    const result = await runDeliveryOrderBatch({ poNos: ['P1', 'P2'], deps, onUpdate: () => {} })

    expect(result.orders[0]).toMatchObject({
      status: 'error',
      message: '明细物料不能为空',
      steps: { create: 'finish', safeParts: 'finish', confirm: 'error', writeBack: 'wait' },
    })
    expect(calls).not.toContain('mark:P1:D1')
    expect(result.orders[1].status).toBe('success')
    expect(calls).toContain('print:2:D2')
  })

  it('skips printing when nothing succeeded', async () => {
    const calls: string[] = []
    const deps = createDeps(calls, {
      createDeliveryOrder: vi.fn(async () => {
        throw new Error('SCM 中订单 P1 没有可送货的明细（可能已生成送货单）')
      }),
    })

    const result = await runDeliveryOrderBatch({ poNos: ['P1'], deps, onUpdate: () => {} })

    expect(result.orders[0].steps.create).toBe('error')
    expect(result.print.status).toBe('skipped')
    expect(deps.printDeliveryOrders).not.toHaveBeenCalled()
  })

  it('keeps finished orders when the export fails', async () => {
    const deps = createDeps([], {
      printDeliveryOrders: vi.fn(async () => {
        throw new Error('导出送货单失败')
      }),
    })

    const result = await runDeliveryOrderBatch({ poNos: ['P1'], deps, onUpdate: () => {} })

    expect(result.orders[0].status).toBe('success')
    expect(result.print).toMatchObject({ status: 'error', message: '导出送货单失败' })
    expect(deps.downloadFile).not.toHaveBeenCalled()
  })

  it('stops after the current step and leaves later orders untouched', async () => {
    const calls: string[] = []
    let stop = false
    const deps = createDeps(calls, {
      addSafePartDetail: vi.fn(async (item: SyneySafePartDetailPlanItem) => {
        calls.push(`add:${item.SafePartNo}`)
        stop = true
        return { skipped: false, message: '保存成功' }
      }),
    })

    const result = await runDeliveryOrderBatch({
      poNos: ['P1', 'P2'],
      deps,
      onUpdate: () => {},
      shouldStop: () => stop,
    })

    expect(calls).toEqual(['load', 'create:P1', 'plan:D1', 'add:D1-1'])
    expect(result.orders.map(order => order.status)).toEqual(['stopped', 'stopped'])
    expect(result.print.status).toBe('skipped')
  })

  it('notes when an existing unconfirmed delivery order is reused', async () => {
    const deps = createDeps([], {
      createDeliveryOrder: vi.fn(async () => ({
        deliveryOrderId: 9,
        deliveryNo: 'D9',
        lineCount: 0,
        reused: true,
        hasSafeParts: true,
      })),
    })

    const result = await runDeliveryOrderBatch({ poNos: ['P1'], deps, onUpdate: () => {} })

    expect(result.orders[0].warnings).toEqual(['SCM 中已有未确认的送货单 D9，已沿用'])
  })
})

describe('describeError', () => {
  it('keeps Chinese messages and appends raw English details to the fallback', () => {
    expect(describeError(new Error('供应商确认失败'), '处理失败')).toBe('供应商确认失败')
    expect(describeError(new Error('Invalid column name \'X\'.'), '处理失败')).toBe(
      '处理失败（Invalid column name \'X\'.）',
    )
    expect(describeError('oops', '处理失败')).toBe('处理失败')
  })
})
