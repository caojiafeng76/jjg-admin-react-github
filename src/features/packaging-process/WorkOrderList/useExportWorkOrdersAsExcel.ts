import { useCallback, useState } from 'react'
import { App } from 'antd'

import type { PackagingWorkOrderSearchParams } from '@/services/apiPackagingWorkOrders'

interface ExportInput {
  searchParams: PackagingWorkOrderSearchParams
}

const loadWorkOrdersExcelDocument = () => import('./workOrdersExcelDocument')

export function useExportWorkOrdersAsExcel() {
  const { message } = App.useApp()
  const [isExporting, setIsExporting] = useState(false)

  const preloadExportAsExcel = useCallback(() => {
    void loadWorkOrdersExcelDocument()
  }, [])

  const exportAsExcel = useCallback(
    async (input: ExportInput) => {
      setIsExporting(true)

      try {
        const { exportWorkOrdersAsExcel } = await loadWorkOrdersExcelDocument()
        const exported = await exportWorkOrdersAsExcel(input)

        if (exported) {
          message.success('生产工单 Excel 导出成功')
        } else {
          message.warning('当前筛选条件下没有可导出的数据')
        }
        return exported
      } catch (error) {
        message.error(
          error instanceof Error ? error.message : '生产工单 Excel 导出失败',
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
