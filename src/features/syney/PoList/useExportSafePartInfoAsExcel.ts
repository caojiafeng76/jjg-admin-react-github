import { utils, writeFile } from 'xlsx-js-style'
import { format } from 'date-fns'
import { message } from 'antd'
import {
  autoFitColumnWidths,
  setRowHeight,
  centerAllCells,
  EXCEL_WRITE_OPTIONS,
} from '@utils/excelStyleUtils'

import { useSelectedPos } from './useSelectedPos'

import { useQuery } from '@tanstack/react-query'
import { getSyneySafePartSettings } from '@services/apiSyneySafePartSettings'

// 判断是否为安全件
function useIsSafePart() {
  const { data: settings } = useQuery({
    queryKey: ['syney_safe_part_settings'],
    queryFn: getSyneySafePartSettings,
    staleTime: 5 * 60 * 1000,
  })

  function isSafePart(partNo: string | null | undefined): boolean {
    if (!partNo || !settings) return false
    return settings.some(
      (item) => item.is_safe_part && partNo.includes(item.part_no),
    )
  }

  return { isSafePart }
}

// Excel 数据行类型
type ExcelRow = {
  序号: number
  采购单号: string | null
  日期: string | null
  编号: string | null | undefined
  型号: string | null | undefined
  名称: string | null | undefined
  件号: string | null
  生产号: string
}

export function useExportSafePartInfoAsExcel() {
  const [messageApi, contextHolder] = message.useMessage()
  const { isLoading, selectedPosList } = useSelectedPos()
  const { isSafePart } = useIsSafePart()

  function exportSafePartInfoAsExcel() {
    // 数据验证
    if (isLoading) {
      messageApi.warning('数据加载中，请稍后再试')
      return
    }

    if (!selectedPosList || selectedPosList.length === 0) {
      messageApi.warning('请选择至少一条数据')
      return
    }

    try {
      // 创建新的工作簿
      const wb = utils.book_new()
      const allSafeParts: ExcelRow[] = []
      let globalIndex = 0

      // 处理每个订单的数据
      selectedPosList.forEach(({ poInfo, items }) => {
        const { SONo, EndDate, No } = poInfo

        // 过滤安全件并转换为 Excel 数据格式
        const excelData: ExcelRow[] = items
          .filter((item) => isSafePart(item.PartNo))
          .map((item) => {
            globalIndex++
            return {
              序号: globalIndex,
              采购单号: No,
              日期: EndDate,
              编号: item.PartCode,
              型号: item.PartModel,
              名称: item.PartName2,
              件号: item.PartNo,
              生产号: SONo,
            }
          })

        // 如果有符合条件的数据才添加工作表
        if (excelData.length > 0) {
          // 为每个工作表添加局部序号（从1开始）
          const sheetData = excelData.map((row, index) => ({
            ...row,
            序号: index + 1,
          }))

          // 创建二维数组用于样式设置
          const headers = Object.keys(sheetData[0])
          const data = [
            headers,
            ...sheetData.map((row) =>
              headers.map((h) => row[h as keyof ExcelRow]),
            ),
          ]
          const ws = utils.aoa_to_sheet(data)
          // 自动调整列宽
          autoFitColumnWidths(ws, data)
          // 设置行高
          setRowHeight(ws, 20, data.length)
          // 居中显示
          centerAllCells(ws, data)
          // 工作表名称限制在31个字符以内（Excel限制）
          const sheetName = SONo.length > 31 ? SONo.substring(0, 31) : SONo
          utils.book_append_sheet(wb, ws, sheetName)

          // 收集所有安全件用于汇总表
          allSafeParts.push(...excelData)
        }
      })

      // 检查是否有工作表
      if (wb.SheetNames.length === 0) {
        messageApi.warning('没有找到符合条件的安全部件数据')
        return
      }

      // 添加汇总表
      if (allSafeParts.length > 0) {
        const summaryData = allSafeParts.map((row) => ({
          ...row,
          序号: row.序号, // 使用全局序号
        }))
        // 创建二维数组用于样式设置
        const headers = Object.keys(summaryData[0])
        const data = [
          headers,
          ...summaryData.map((row) =>
            headers.map((h) => row[h as keyof ExcelRow]),
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

      // 生成文件名（包含日期和时间戳，避免覆盖）
      const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss')
      const fileName = `安全部件信息-${timestamp}.xlsx`

      // 导出文件
      writeFile(wb, fileName, EXCEL_WRITE_OPTIONS)
      messageApi.success(`导出成功！共 ${allSafeParts.length} 条安全部件数据`)
    } catch (error) {
      console.error('导出失败:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      messageApi.error(`导出失败: ${errorMessage}`)
    }
  }

  return { exportSafePartInfoAsExcel, contextHolder }
}
