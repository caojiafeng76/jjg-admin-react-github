import { utils, writeFile } from 'xlsx-js-style'
import { format } from 'date-fns'

import {
  autoFitColumnWidths,
  setRowHeight,
  EXCEL_WRITE_OPTIONS,
} from '@utils/excelStyleUtils'
import type { VillaLiftOrder } from '@/services/apiVillaLiftOrders'

const HEADER_ROW_HEIGHT = 28
const BODY_ROW_HEIGHT = 22

const EXCEL_HEADERS = [
  '序号',
  '计划交货日期',
  '排产日期',
  '客户',
  '项目名称',
  '产品名称',
  '颜色',
  '数量',
  '挑料计划完成日期',
  '挑料完成日期',
  '喷涂计划完成日期',
  '喷涂完成日期',
  '贴膜计划完成日期',
  '贴膜完成日期',
  '切割要求完成日期',
  '切割实际完成日期',
  '加工要求完成日期',
  '加工实际完成日期',
  '轿箱加工完成日期',
  '中分门加工完成日期',
  '井架加工完成日期',
  '检验完成日期',
  '组装完成日期',
  '包装完成日期',
  '发货日期',
  '备注',
  '状态',
] as const

const FIELD_MAP: Record<string, keyof VillaLiftOrder> = {
  计划交货日期: 'planned_delivery_date',
  排产日期: 'schedule_date',
  客户: 'customer',
  项目名称: 'project_name',
  产品名称: 'product_name',
  颜色: 'color',
  数量: 'quantity',
  挑料计划完成日期: 'tinting_plan_date',
  挑料完成日期: 'material_selection_date',
  喷涂计划完成日期: 'painting_plan_date',
  喷涂完成日期: 'painting_date',
  贴膜计划完成日期: 'film_plan_date',
  贴膜完成日期: 'film_date',
  切割要求完成日期: 'cutting_required_date',
  切割实际完成日期: 'cutting_actual_date',
  加工要求完成日期: 'processing_required_date',
  加工实际完成日期: 'processing_actual_date',
  轿箱加工完成日期: 'cabin_processing_date',
  中分门加工完成日期: 'middle_door_processing_date',
  井架加工完成日期: 'frame_processing_date',
  检验完成日期: 'inspection_date',
  组装完成日期: 'assembly_date',
  包装完成日期: 'packaging_date',
  发货日期: 'delivery_date',
  备注: 'remarks',
  状态: 'status',
}

function applyHeaderStyle(
  ws: ReturnType<typeof utils.aoa_to_sheet>,
  colCount: number,
) {
  for (let col = 0; col < colCount; col++) {
    const cellRef = `${String.fromCharCode(65 + col)}1`
    if (!ws[cellRef]) ws[cellRef] = { v: '' }
    ws[cellRef].s = {
      ...(ws[cellRef].s || {}),
      font: { name: '宋体', sz: 11, bold: true },
      alignment: { horizontal: 'center', vertical: 'center' },
      fill: { fgColor: { rgb: 'D8E4F1' } },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } },
      },
    }
  }
}

function applyBodyStyle(
  ws: ReturnType<typeof utils.aoa_to_sheet>,
  rowCount: number,
  colCount: number,
) {
  for (let row = 1; row < rowCount; row++) {
    for (let col = 0; col < colCount; col++) {
      const cellRef = `${String.fromCharCode(65 + col)}${row + 1}`
      if (!ws[cellRef]) ws[cellRef] = { v: '' }
      ws[cellRef].s = {
        ...(ws[cellRef].s || {}),
        font: { name: '宋体', sz: 10 },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        },
      }
    }
  }
}

export function useExportVillaLiftOrdersAsExcel() {
  function exportAsExcel(orders: VillaLiftOrder[]) {
    if (!orders || orders.length === 0) return false

    const wb = utils.book_new()
    const rows: (string | number)[][] = []

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i]
      const row: (string | number)[] = [i + 1]

      for (const header of EXCEL_HEADERS.slice(1)) {
        const field = FIELD_MAP[header]
        let value: string | number = ''
        const raw = order[field] as string | number | null | undefined
        if (raw != null) {
          if (field === 'status') {
            value = raw === 'closed' ? '已结案' : '未结案'
          } else {
            value = raw
          }
        }
        row.push(value)
      }
      rows.push(row)
    }

    const data: (string | number)[][] = [
      Array.from(EXCEL_HEADERS),
      ...rows,
    ]
    const ws = utils.aoa_to_sheet(data)

    autoFitColumnWidths(ws, data, 8, 60)
    setRowHeight(ws, HEADER_ROW_HEIGHT, 1)
    setRowHeight(ws, BODY_ROW_HEIGHT, rows.length)

    applyHeaderStyle(ws, EXCEL_HEADERS.length)
    applyBodyStyle(ws, rows.length + 1, EXCEL_HEADERS.length)

    ws['!freeze'] = { xSplit: 0, ySplit: 1 }

    utils.book_append_sheet(wb, ws, '别墅梯订单')
    writeFile(
      wb,
      `别墅梯订单_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
      EXCEL_WRITE_OPTIONS,
    )
    return true
  }

  return { exportAsExcel }
}
