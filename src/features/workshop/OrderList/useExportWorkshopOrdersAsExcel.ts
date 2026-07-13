import { useCallback, useState } from 'react'
import { App } from 'antd'

import type { WorkshopOrder } from './index'

const loadWorkshopOrdersExcelDocument = () =>
  import('./workshopOrdersExcelDocument')

export function useExportWorkshopOrdersAsExcel() {
  const { message } = App.useApp()
  const [isExporting, setIsExporting] = useState(false)

  const preloadExportAsExcel = useCallback(() => {
    void loadWorkshopOrdersExcelDocument()
  }, [])

  const exportAsExcel = useCallback(
    async (orders: WorkshopOrder[]) => {
      if (!orders.length) {
        message.warning('请选择要导出的订单')
        return false
      }

      setIsExporting(true)

      try {
        const { exportWorkshopOrdersAsExcel } =
          await loadWorkshopOrdersExcelDocument()
        const exported = await exportWorkshopOrdersAsExcel(orders)

        if (exported) {
          message.success('订单 Excel 导出成功')
        }
        return exported
      } catch (error) {
        message.error(
          error instanceof Error ? error.message : '订单 Excel 导出失败',
        )
        return false
      } finally {
        setIsExporting(false)
      }
    },
    [message],
  )

  return { exportAsExcel, isExporting, preloadExportAsExcel }
}
