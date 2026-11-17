import type {
  OrderStatusDashboardItem,
  OrderStatusJobColumn,
} from '@/services/apiOrderStatusDashboard'
import { App } from 'antd'
import { useState } from 'react'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'

function loadOrderStatusDashboardExcel() {
  return import('@/utils/orderStatusDashboardExcel')
}

export function preloadOrderStatusDashboardExcel() {
  void loadOrderStatusDashboardExcel()
}

export function useOrderStatusDashboardExport({
  rows,
  jobColumns,
  startIndex,
}: {
  rows: readonly OrderStatusDashboardItem[]
  jobColumns: readonly OrderStatusJobColumn[]
  startIndex: number
}) {
  const { message } = App.useApp()
  const [isExporting, setIsExporting] = useState(false)

  async function handleExportCurrentPage(): Promise<void> {
    if (rows.length === 0) {
      message.warning('当前页没有可导出的订单现状数据')
      return
    }

    try {
      // 固定点击时的当前页快照，避免模块加载期间翻页或后台刷新影响文件。
      const exportRows = structuredClone(rows)
      const exportJobColumns = structuredClone(jobColumns)
      setIsExporting(true)
      message.open({
        key: 'order-status-dashboard-export',
        type: 'loading',
        content: '正在导出当前页订单现状...',
        duration: 0,
      })

      const { exportOrderStatusDashboardToExcel }
        = await loadOrderStatusDashboardExcel()
      exportOrderStatusDashboardToExcel(exportRows, exportJobColumns, startIndex)
      message.success({
        key: 'order-status-dashboard-export',
        content: feedbackText.exported('订单现状', exportRows.length),
      })
    }
    catch (error) {
      message.error({
        key: 'order-status-dashboard-export',
        content: getUserErrorMessage(error, feedbackText.failed('导出', '订单现状')),
      })
    }
    finally {
      setIsExporting(false)
    }
  }

  return {
    handleExportCurrentPage,
    isExporting,
    preloadOrderStatusDashboardExcel,
  }
}
