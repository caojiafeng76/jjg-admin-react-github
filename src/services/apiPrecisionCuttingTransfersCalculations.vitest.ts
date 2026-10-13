import { describe, expect, it, vi } from 'vitest'

import {
  applyPrecisionCuttingTransferFilters,
  chunkArray,
  normalizePrecisionCuttingTransferInsertPayload,
  normalizePrecisionCuttingTransferUpdatePayload,
  roundTo,
} from './apiPrecisionCuttingTransfersCalculations'
import type { PrecisionCuttingTransferInsert } from './apiPrecisionCuttingTransfersTypes'

const BASE_INSERT: PrecisionCuttingTransferInsert = {
  project_no: ' P001 ',
  long_material_length_mm: 6000,
  long_material_quantity: 10,
  operator_names: [' 吴国忠 ', '吴国忠', '蒋建祥'],
  processing_defect_count: 1,
  raw_material_defect_count: 0,
  recipient_name: ' 贾小勇 ',
  target_workshop: '精加工',
  transfer_quantity: 20,
}

describe('精切转移计算函数', () => {
  it('新建数据去空格、操作人去重，外协不良数缺省为 0、可选长料数量缺省为 null', () => {
    expect(
      normalizePrecisionCuttingTransferInsertPayload(BASE_INSERT),
    ).toMatchObject({
      project_no: 'P001',
      recipient_name: '贾小勇',
      operator_names: ['吴国忠', '蒋建祥'],
      outsource_defect_quantity: 0,
      process_card_long_material_quantity: null,
      erp_long_material_quantity: null,
      is_audited: false,
    })
  })

  it('操作人不在固定名单、不良数为负、长料长度非正时抛出中文错误', () => {
    expect(() =>
      normalizePrecisionCuttingTransferInsertPayload({
        ...BASE_INSERT,
        operator_names: ['张三'],
      }),
    ).toThrow('操作人必须从固定名单中选择')
    expect(() =>
      normalizePrecisionCuttingTransferInsertPayload({
        ...BASE_INSERT,
        raw_material_defect_count: -1,
      }),
    ).toThrow('原料不良数必须为大于等于 0 的整数')
    expect(() =>
      normalizePrecisionCuttingTransferUpdatePayload({
        long_material_length_mm: 0,
      }),
    ).toThrow('长料长度必须大于 0')
    expect(() =>
      normalizePrecisionCuttingTransferUpdatePayload({
        erp_long_material_quantity: 1.5,
      }),
    ).toThrow('ERP长料数量必须为大于 0 的整数')
  })

  it('更新数据只规整传入的字段', () => {
    expect(
      normalizePrecisionCuttingTransferUpdatePayload({
        remark: '  ',
        is_audited: true,
      }),
    ).toEqual({ remark: null, is_audited: true })
  })

  it('筛选条件按字段转换为查询调用', () => {
    const calls: unknown[][] = []
    const query = {} as Record<string, (...args: unknown[]) => unknown>
    for (const method of ['ilike', 'contains', 'eq', 'gte', 'lt']) {
      query[method] = vi.fn((...args: unknown[]) => {
        calls.push([method, ...args])
        return query
      })
    }

    applyPrecisionCuttingTransferFilters(
      query as unknown as Parameters<
        typeof applyPrecisionCuttingTransferFilters
      >[0],
      { projectNo: 'P0', operatorName: '吴国忠', isAudited: true },
    )

    expect(calls).toEqual([
      ['ilike', 'project_no', '%P0%'],
      ['contains', 'operator_names', ['吴国忠']],
      ['eq', 'is_audited', true],
    ])
  })

  it('分块与保留小数', () => {
    expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
    expect(roundTo(1.26, 1)).toBe(1.3)
    expect(roundTo(2.346)).toBe(2.35)
  })
})
