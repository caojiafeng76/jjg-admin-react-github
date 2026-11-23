import {
  autoFitColumnWidths,
  centerAllCells,
  EXCEL_WRITE_OPTIONS,
  setRowHeight,
} from '@utils/excelStyleUtils'
import dayjs from 'dayjs'
import { useState } from 'react'

import { useTableSelection } from '../useTableSelection'
import { useFetchSelectedReports } from './useFetchSelectedReports'

const loadExcel = () => import('xlsx-js-style')

export function useExportReportsAsExcel() {
  const { tableSelectedKeys } = useTableSelection()
  const { fetchSelectedReports } = useFetchSelectedReports()
  const [isExporting, setIsExporting] = useState(false)

  function preloadExcel() {
    void loadExcel()
  }

  async function saveReportsAsExcel() {
    if (isExporting) {
      return false
    }

    if (tableSelectedKeys.length === 0) {
      return false
    }

    setIsExporting(true)
    try {
      const selectedMap = await fetchSelectedReports()

      if (selectedMap.size === 0) {
        return false
      }

      const { utils, writeFile } = await loadExcel()

      const wb = utils.book_new()
      const totalData: { 序号: string, 入库单号: string, 金额: number }[] = []

      selectedMap.forEach((data, No) => {
        totalData.push({
          序号: `${totalData.length + 1}`,
          入库单号: No,
          金额: data.totalAmount,
        })

        const excelData = data.items.map((item, index) => ({
          序号: index + 1,
          件号: item.PartNo,
          名称: item.PartName,
          规格: item.Spec,
          参数规格: item.ParamSpec,
          单位: item.Unit,
          单价: item.TaxUnitPrice?.toFixed(2),
          数量: item.Qty,
          小计: item.TaxTotalPrice?.toFixed(2),
        }))

        // 创建二维数组用于样式设置
        if (excelData.length > 0) {
          const headers = Object.keys(excelData[0])
          const data = [
            headers,
            ...excelData.map(row =>
              headers.map(h => row[h as keyof (typeof excelData)[0]]),
            ),
          ]
          const ws = utils.aoa_to_sheet(data)
          // 自动调整列宽
          autoFitColumnWidths(ws, data)
          // 设置行高
          setRowHeight(ws, 20, data.length)
          // 居中显示
          centerAllCells(ws, data)
          utils.book_append_sheet(wb, ws, No)
        }
      })

      totalData.push({
        序号: '*',
        入库单号: '合计',
        金额: totalData.reduce((acc, cur) => acc + cur.金额, 0),
      })

      // 创建二维数组用于样式设置
      if (totalData.length > 0) {
        const headers = Object.keys(totalData[0])
        const data = [
          headers,
          ...totalData.map(row =>
            headers.map(h => row[h as keyof (typeof totalData)[0]]),
          ),
        ]
        const summaryWs = utils.aoa_to_sheet(data)
        // 自动调整列宽
        autoFitColumnWidths(summaryWs, data)
        // 设置行高
        setRowHeight(summaryWs, 20, data.length)
        // 居中显示
        centerAllCells(summaryWs, data)
        utils.book_append_sheet(wb, summaryWs, '汇总')
      }

      writeFile(
        wb,
        `入库单明细--${dayjs(new Date()).format('YYYY-MM-DD')}.xlsx`,
        EXCEL_WRITE_OPTIONS,
      )
      return true
    }
    finally {
      setIsExporting(false)
    }
  }

  return {
    saveReportsAsExcel,
    preloadExcel,
    isLoading: isExporting,
  }
}
