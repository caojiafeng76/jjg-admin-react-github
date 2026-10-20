import type {
  OrderStatusDashboardFilters,
  OrderStatusJobColumn,
} from '@/services/apiOrderStatusDashboard'
import { App } from 'antd'
import { useState } from 'react'
import { getOrderStatusDashboardForExport } from '@/services/apiOrderStatusDashboard'

function loadOrderStatusDashboardExcel() {
  return import('@/utils/orderStatusDashboardExcel')
}

export function preloadOrderStatusDashboardExcel() {
  void loadOrderStatusDashboardExcel()
}

export function useOrderStatusDashboardExport({
  filters,
  jobColumns,
  total,
}: {
  filters: OrderStatusDashboardFilters
  jobColumns: OrderStatusJobColumn[]
  total: number | undefined
}) {
  const { message } = App.useApp()
  const [isExporting, setIsExporting] = useState(false)

  async function handleExportCurrentFilters() {
    if (total === 0) {
      message.warning('当前没有可导出的订单现状数据')
      return
    }

    try {
      setIsExporting(true)
      message.open({
        key: 'order-status-dashboard-export',
        type: 'loading',
        content: '正在导出当前筛选结果...',
        duration: 0,
      })

      const exportRows = await getOrderStatusDashboardForExport({
        filters,
        total: total ?? 0,
      })

      if (exportRows.length === 0) {
        message.warning({
          key: 'order-status-dashboard-export',
          content: '当前没有可导出的订单现状数据',
        })
        return
      }

      const { exportOrderStatusDashboardToExcel }
        = await loadOrderStatusDashboardExcel()
      exportOrderStatusDashboardToExcel(exportRows, jobColumns)
      message.success({
        key: 'order-status-dashboard-export',
        content: `已导出 ${exportRows.length} 条订单现状数据`,
      })
    }
    catch (error) {
      message.error({
        key: 'order-status-dashboard-export',
        content: error instanceof Error ? error.message : '导出失败',
      })
    }
    finally {
      setIsExporting(false)
    }
  }

  return {
    handleExportCurrentFilters,
    isExporting,
    preloadOrderStatusDashboardExcel,
  }
}
