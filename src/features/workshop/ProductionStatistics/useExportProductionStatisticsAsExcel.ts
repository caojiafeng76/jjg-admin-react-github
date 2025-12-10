import { useState } from 'react'
import { message } from 'antd'
import { utils, writeFile } from 'xlsx'
import dayjs from 'dayjs'

import type { ProductionStatisticsRow } from './useProductionStatistics'

type MessageApi = ReturnType<typeof message.useMessage>[0]

export function useExportProductionStatisticsAsExcel(messageApi?: MessageApi) {
  const [internalMessageApi, contextHolder] = message.useMessage()
  const api = messageApi || internalMessageApi
  const [isExporting, setIsExporting] = useState(false)

  async function exportProductionStatisticsAsExcel(
    rows: ProductionStatisticsRow[],
    defectReasonColumns: string[],
    processColumns: string[],
    searchParams: { startDate?: string; endDate?: string },
  ) {
    if (!rows || rows.length === 0) {
      api.warning('请先选择需要导出的统计数据')
      return
    }

    try {
      setIsExporting(true)

      const headers = [
        '序号',
        '项目号',
        '产品型号',
        '客户型号',
        '长度(mm)',
        '日期范围',
        '合格数量',
        ...processColumns.map((item) => `${item}-合格数`),
        '不合格总数',
        '不合格重量(kg)',
        ...defectReasonColumns,
        '操作人',
      ]

      const data = rows.map((row, index) => {
        const record: Record<string, string | number> = {
          序号: index + 1,
          项目号: row.projectNo || '',
          产品型号: row.productModel || '',
          客户型号: row.customerModel || '',
          '长度(mm)': row.lengthMm || '',
          日期范围: row.dateRange,
          合格数量: row.qualifiedQuantity || 0,
          不合格总数: row.defectiveQuantity || 0,
          '不合格重量(kg)': row.defectiveWeightKg
            ? Number(row.defectiveWeightKg.toFixed(2))
            : '',
          操作人: row.operators.join('、'),
        }

        processColumns.forEach((process) => {
          const qty = row.processQualifiedCounts[process] || 0
          record[`${process}-合格数`] = qty > 0 ? qty : ''
        })

        defectReasonColumns.forEach((reason) => {
          const qty = row.defectReasonCounts[reason] || 0
          record[reason] = qty > 0 ? qty : ''
        })

        return record
      })

      const ws = utils.json_to_sheet(data, { header: headers })

      ws['!cols'] = headers.map((header) => {
        const maxWidth = data.reduce((max, row) => {
          const value = row[header]
          const text = value === undefined ? '' : String(value)
          return Math.max(max, text.length)
        }, header.length)
        return { wch: Math.min(Math.max(maxWidth + 2, 8), 50) }
      })

      const wb = utils.book_new()
      utils.book_append_sheet(wb, ws, '产量统计')

      const dateRangeText =
        searchParams.startDate && searchParams.endDate
          ? `${dayjs(searchParams.startDate).format('YY.MM.D')}-${dayjs(
              searchParams.endDate,
            ).format('YY.MM.D')}`
          : dayjs().format('YY.MM.D')

      writeFile(
        wb,
        `产量统计_${dateRangeText}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`,
      )

      api.success('Excel 导出完成')
    } catch (error) {
      console.error('导出产量统计失败', error)
      api.error('导出失败，请重试')
    } finally {
      setIsExporting(false)
    }
  }

  return {
    exportProductionStatisticsAsExcel,
    isExporting,
    contextHolder,
  }
}

