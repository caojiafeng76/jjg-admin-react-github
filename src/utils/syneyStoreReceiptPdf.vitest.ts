import { describe, expect, it } from 'vitest'

import {
  buildSyneyStoreReceiptPages,
  buildSyneyStoreReceiptReport,
  formatSyneyStoreReceiptDate,
  getSyneyStoreReceiptPdfLayout,
  toReceiptDisplayText,
  type SyneyStoreReceiptItem,
} from './syneyStoreReceiptPdf'

function createItem(
  overrides: Partial<SyneyStoreReceiptItem> = {},
): SyneyStoreReceiptItem {
  return {
    ID: 1,
    No: 'RK-20260516-001',
    CreateOn: '2026-05-16T08:30:00',
    SupplierName: '湖州银都铝业科技有限公司',
    SupplierCode: 'HYD',
    DeliveryOrderNo: 'DN-001',
    Address: 'A-01',
    ParamSpec: '1000',
    PartName: '踏板',
    PartNo: 'PN-001',
    Qty: 2,
    Remark: null,
    SONo: 'SO-001',
    Spec: '1000*400',
    TaxUnitPrice: null,
    Unit: '件',
    ...overrides,
  }
}

describe('syney store receipt PDF helpers', () => {
  it('builds receipt header data from SCM rows', () => {
    const report = buildSyneyStoreReceiptReport([
      createItem(),
      createItem({
        ID: 2,
        DeliveryOrderNo: 'DN-002',
        PartNo: 'PN-002',
      }),
      createItem({
        ID: 3,
        DeliveryOrderNo: 'DN-001',
        PartNo: 'PN-003',
      }),
    ])

    expect(report.No).toBe('RK-20260516-001')
    expect(report.CreateOn).toBe('2026-05-16T08:30:00')
    expect(report.SupplierName).toBe('湖州银都铝业科技有限公司(HYD)')
    expect(report.DeliveryOrderNos).toEqual(['DN-001', 'DN-002'])
    expect(report.items).toHaveLength(3)
  })

  it('keeps one printable page when there are no rows', () => {
    const pages = buildSyneyStoreReceiptPages({ items: [] }, 11)

    expect(pages).toEqual([
      {
        items: [],
        pageNumber: 1,
        rowStartIndex: 0,
        totalPages: 1,
      },
    ])
  })

  it('splits receipt rows into fixed-size pages', () => {
    const items = Array.from({ length: 23 }, (_, index) =>
      createItem({ ID: index + 1, PartNo: `PN-${index + 1}` }),
    )

    const pages = buildSyneyStoreReceiptPages({ items }, 11)

    expect(pages).toHaveLength(3)
    expect(pages.map((page) => page.items.length)).toEqual([11, 11, 1])
    expect(pages.map((page) => page.pageNumber)).toEqual([1, 2, 3])
    expect(pages.map((page) => page.rowStartIndex)).toEqual([0, 11, 22])
    expect(pages.every((page) => page.totalPages === 3)).toBe(true)
  })

  it('formats dates and nullable values for receipt cells', () => {
    expect(formatSyneyStoreReceiptDate('2026-05-16T08:30:00')).toBe(
      '2026/05/16',
    )
    expect(formatSyneyStoreReceiptDate('')).toBe('')
    expect(formatSyneyStoreReceiptDate(null)).toBe('')
    expect(toReceiptDisplayText(null)).toBe('')
    expect(toReceiptDisplayText(undefined)).toBe('')
    expect(toReceiptDisplayText(0)).toBe('0')
    expect(toReceiptDisplayText('入库单')).toBe('入库单')
  })

  it('places table content directly after the receipt info box', () => {
    const layout = getSyneyStoreReceiptPdfLayout()

    expect(layout.tableTop).toBe(layout.infoBoxTop + layout.infoBoxHeight)
    expect(layout.logoPath).toBe('/syney-logo.png')
  })
})
