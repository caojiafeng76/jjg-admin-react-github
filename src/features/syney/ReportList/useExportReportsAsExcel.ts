import { utils, writeFile } from 'xlsx'
import { format } from 'date-fns'

import { useSelectedReports } from './useSelectedReports'
import { useAppStore } from '@/store'

export function useExportReportsAsExcel() {
  const { tableSelectedKeys } = useAppStore()

  // 只在有选中项时才查询数据
  const { selectedMap, selectedReportsLoading } = useSelectedReports(
    tableSelectedKeys.length > 0
  )

  function saveReportsAsExcel() {
    // 如果数据还在加载，返回 false 表示未导出
    if (selectedReportsLoading) {
      return false
    }

    // 如果没有数据，返回 false 表示未导出
    if (!selectedMap || selectedMap.size === 0) {
      return false
    }

    const wb = utils.book_new()
    const totalData: { 序号: string; 入库单号: string; 金额: number }[] = []

    selectedMap?.forEach((data, No) => {
      totalData.push({
        序号: totalData.length + 1 + '',
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

      const ws = utils.json_to_sheet(excelData || [])
      utils.book_append_sheet(wb, ws, No)
    })

    totalData.push({
      序号: '*',
      入库单号: '合计',
      金额: totalData.reduce((acc, cur) => acc + cur.金额, 0),
    })

    utils.book_append_sheet(wb, utils.json_to_sheet(totalData || []), '汇总')

    writeFile(wb, `入库单明细--${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
    return true // 返回 true 表示导出成功
  }

  return {
    saveReportsAsExcel,
    isLoading: selectedReportsLoading,
  }
}
