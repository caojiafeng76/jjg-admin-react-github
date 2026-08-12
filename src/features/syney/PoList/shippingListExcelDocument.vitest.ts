import { describe, expect, it, vi } from 'vitest'
import { utils } from 'xlsx-js-style'

import { exportShippingListAsExcel } from './shippingListExcelDocument'

const writeFileMock = vi.hoisted(() => vi.fn())

vi.mock('xlsx-js-style', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  const xlsx = (actual.default ?? actual) as typeof import('xlsx-js-style')

  return {
    ...actual,
    ...xlsx,
    default: {
      ...xlsx,
      writeFile: writeFileMock,
    },
    writeFile: writeFileMock,
  }
})

describe('exportShippingListAsExcel', () => {
  it('builds a shipping list with headers, data and an empty delivery-note column', () => {
    writeFileMock.mockClear()

    const result = exportShippingListAsExcel(
      [
        {
          No: 'P202607310731',
          SONo: 'XNJD-FZ26-100-0249',
          Brand: '西尼',
          Spec: '1000型-室外-扶梯',
          Technique: '前：商标\n中：雷达孔',
          Remark: '',
        },
        {
          No: 'P202608030361',
          SONo: 'JD-FZ26-101-0250',
          Brand: '永大电梯设备(中国)有限公司',
          Spec: '1000型-室外-扶梯',
          Technique: 'null', // 数据库 null 经 key 拼接后的字面值，应归一化为空
          Remark: '贴牌梯,注意不要出现西尼字样',
        },
      ],
      new Date('2026-08-13'),
    )

    expect(result).toBe(true)
    expect(writeFileMock).toHaveBeenCalledTimes(1)
    const [wb, fileName] = writeFileMock.mock.calls[0]
    expect(fileName).toBe('发货清单-2026-08-13.xlsx')
    expect(wb.SheetNames).toEqual(['发货清单'])

    const rows = utils.sheet_to_json<unknown[]>(wb.Sheets['发货清单'], {
      header: 1,
      defval: '',
    })

    expect(rows).toHaveLength(4)
    // 标题行：合并单元格，仅首列有值；日期为导出日往后一天（8.13 导出 → 8.14 发货）
    expect(rows[0][0]).toBe('8.14发货清单')
    expect(rows[1]).toEqual([
      '序号',
      '采购单号',
      '生产编号',
      '送货单号',
      '商标',
      '规格',
      '工艺',
      '备注',
    ])
    // 第一行数据：字段映射正确，送货单号留空
    expect(rows[2]).toEqual([
      1,
      'P202607310731',
      'XNJD-FZ26-100-0249',
      '',
      '西尼',
      '1000型-室外-扶梯',
      '前：商标\n中：雷达孔',
      '',
    ])
    // 第二行数据：备注正确写入，字面 "null" 归一化为空
    expect(rows[3]).toEqual([
      2,
      'P202608030361',
      'JD-FZ26-101-0250',
      '',
      '永大电梯设备(中国)有限公司',
      '1000型-室外-扶梯',
      '',
      '贴牌梯,注意不要出现西尼字样',
    ])
  })

  it('returns false when no orders are provided', () => {
    writeFileMock.mockClear()
    expect(exportShippingListAsExcel([])).toBe(false)
    expect(writeFileMock).not.toHaveBeenCalled()
  })
})
