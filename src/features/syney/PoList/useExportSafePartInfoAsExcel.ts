import { utils, writeFile } from 'xlsx'
import { format } from 'date-fns'
import { message } from 'antd'

import { useSelectedPos } from './useSelectedPos'

export function useExportSafePartInfoAsExcel() {
  const [messageApi, contextHolder] = message.useMessage()
  const { isLoading, selectedMap } = useSelectedPos()

  function exportSafePartInfoAsExcel() {
    // 数据验证
    if (isLoading) {
      messageApi.warning('数据加载中，请稍后再试')
      return
    }

    if (!selectedMap || selectedMap.size === 0) {
      messageApi.warning('请选择至少一条数据')
      return
    }

    try {
      // 创建新的工作簿
      const wb = utils.book_new()

      // 准备数据并添加到工作簿
      selectedMap.forEach((data, key) => {
        const [SONo, , EndDate, No] = key.split('~')

        const excelData = data
          .filter(
            (item) =>
              item.PartNo?.includes('XN2808EB') ||
              item.PartNo?.includes('XN3024BR') ||
              item.PartNo?.includes('XN2808BP') ||
              item.PartNo?.includes('XN3024BS') ||
              item.PartNo?.includes('XN2808JY') ||
              item.PartNo?.includes('XN3024DF'),
          )
          .map((item, index) => ({
            序号: index + 1,
            采购单号: No,
            日期: EndDate,
            编号: item.PartCode,
            型号: item.PartModel,
            名称: item.PartName2,
            件号: item.PartNo,
            生产号: SONo,
          }))

        // 如果有符合条件的数据才添加工作表
        if (excelData.length > 0) {
          const ws = utils.json_to_sheet(excelData)
          utils.book_append_sheet(wb, ws, `${SONo}`)
        }
      })

      // 检查是否有工作表
      if (wb.SheetNames.length === 0) {
        messageApi.warning('没有找到符合条件的安全部件数据')
        return
      }

      // 导出文件
      writeFile(wb, `安全部件信息-${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
      messageApi.success('导出成功')
    } catch (error) {
      console.error('导出失败:', error)
      messageApi.error('导出失败，请重试')
    }
  }

  return { exportSafePartInfoAsExcel, contextHolder }
}
