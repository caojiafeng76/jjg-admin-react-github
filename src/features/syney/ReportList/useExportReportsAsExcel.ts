import { utils, writeFile } from 'xlsx'
import { useSelectedReports } from './useSelectedReports'
import { format } from 'date-fns'

export function useExportReportsAsExcel() {
  const wb = utils.book_new()

  const { selectedMap, selectedReportsLoading } = useSelectedReports()

  const totalData: { 序号: string; 入库单号: string; 金额: number }[] = []

  if (!selectedReportsLoading) {
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
  }

  function saveReportsAsExcel() {
    writeFile(wb, `入库单明细--${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
  }

  return { saveReportsAsExcel }
}
