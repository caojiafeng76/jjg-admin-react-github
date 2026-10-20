import type { ProductionOrderFilters } from '@/services/apiProductionOrders'
import { App } from 'antd'
import { useCallback, useState } from 'react'
import {
  getProductionOrdersForExportByFiltersChunked,
  getProductionOrdersForExportChunked,
  PRODUCTION_ORDER_CHUNKED_EXPORT_PAGE_SIZE,

} from '@/services/apiProductionOrders'

const loadProductionOrderExcel = () => import('@/utils/productionOrderExcel')
function loadProductionOrderNightSnackExcel() {
  return import('@/utils/productionOrderNightSnackExcel')
}

function preloadProductionOrderExcel() {
  void loadProductionOrderExcel()
}

function preloadProductionOrderNightSnackExcel() {
  void loadProductionOrderNightSnackExcel()
}
export function useProductionOrderExport({
  employeeName,
  filters,
  selectedRowKeys,
  setSelectedRowKeys,
  total,
}: {
  employeeName?: string
  filters: ProductionOrderFilters
  selectedRowKeys: React.Key[]
  setSelectedRowKeys: (keys: React.Key[]) => void
  total: number | undefined
}) {
  const { message } = App.useApp()
  const [isExporting, setIsExporting] = useState(false)
  const [isNightSnackExporting, setIsNightSnackExporting] = useState(false)
  const handleExport = useCallback(async () => {
    const exportTargetCount
      = selectedRowKeys.length > 0 ? selectedRowKeys.length : (total ?? 0)

    if (exportTargetCount === 0) {
      message.warning('当前没有可导出的工单')
      return
    }

    try {
      setIsExporting(true)
      let exportCount = exportTargetCount
      const updateProgress = (loaded: number, total: number) => {
        message.open({
          key: 'production-order-export',
          type: 'loading',
          content: `正在分片读取工单 ${loaded}/${total}，每批 ${PRODUCTION_ORDER_CHUNKED_EXPORT_PAGE_SIZE} 条...`,
          duration: 0,
        })
      }

      updateProgress(0, exportTargetCount)

      const exportOrders
        = selectedRowKeys.length > 0
          ? await getProductionOrdersForExportChunked(
              selectedRowKeys.map(key => String(key)),
              {
                onProgress: ({ loaded, total }) => {
                  updateProgress(loaded, total)
                },
              },
            )
          : await getProductionOrdersForExportByFiltersChunked(filters, {
              onProgress: ({ loaded, total }) => {
                updateProgress(loaded, total)
              },
            })

      exportCount = exportOrders.length

      message.open({
        key: 'production-order-export',
        type: 'loading',
        content: `已读取 ${exportCount} 张工单，正在合并生成 Excel...`,
        duration: 0,
      })

      const { exportProductionOrdersToExcel } = await loadProductionOrderExcel()
      await exportProductionOrdersToExcel(exportOrders)

      message.success({
        key: 'production-order-export',
        content: `已导出 ${exportCount} 张工单`,
      })

      if (selectedRowKeys.length > 0) {
        setSelectedRowKeys([])
      }
    }
    catch (error) {
      if (error instanceof Error) {
        message.error({
          key: 'production-order-export',
          content: error.message,
        })
      }
      else {
        message.error({
          key: 'production-order-export',
          content: '导出失败，请稍后重试',
        })
      }
    }
    finally {
      setIsExporting(false)
    }
  }, [filters, message, selectedRowKeys, setSelectedRowKeys, total])

  const handleNightSnackExport = useCallback(async () => {
    const exportTargetCount
      = selectedRowKeys.length > 0 ? selectedRowKeys.length : (total ?? 0)

    if (exportTargetCount === 0) {
      message.warning('当前没有可导出的工单')
      return
    }

    try {
      setIsNightSnackExporting(true)
      const updateProgress = (loaded: number, total: number) => {
        message.open({
          key: 'production-order-night-snack-export',
          type: 'loading',
          content: `正在分片读取夜宵明细 ${loaded}/${total}，每批 ${PRODUCTION_ORDER_CHUNKED_EXPORT_PAGE_SIZE} 条...`,
          duration: 0,
        })
      }

      updateProgress(0, exportTargetCount)

      const exportOrders
        = selectedRowKeys.length > 0
          ? await getProductionOrdersForExportChunked(
              selectedRowKeys.map(key => String(key)),
              {
                onProgress: ({ loaded, total }) => {
                  updateProgress(loaded, total)
                },
              },
            )
          : await getProductionOrdersForExportByFiltersChunked(filters, {
              onProgress: ({ loaded, total }) => {
                updateProgress(loaded, total)
              },
            })

      message.open({
        key: 'production-order-night-snack-export',
        type: 'loading',
        content: `已读取 ${exportOrders.length} 张工单，正在生成夜宵明细表...`,
        duration: 0,
      })

      const { exportProductionOrderNightSnackDetailsToExcel }
        = await loadProductionOrderNightSnackExcel()
      const result = exportProductionOrderNightSnackDetailsToExcel(
        exportOrders,
        {
          statistician: employeeName || '',
        },
      )

      if (result.nightShiftCount === 0) {
        message.warning({
          key: 'production-order-night-snack-export',
          content: '当前工单中没有可导出的夜班记录',
        })
        return
      }

      message.success({
        key: 'production-order-night-snack-export',
        content: `已导出 ${result.employeeCount} 名员工、${result.nightShiftCount} 个夜班`,
      })

      if (selectedRowKeys.length > 0) {
        setSelectedRowKeys([])
      }
    }
    catch (error) {
      if (error instanceof Error) {
        message.error({
          key: 'production-order-night-snack-export',
          content: error.message,
        })
      }
      else {
        message.error({
          key: 'production-order-night-snack-export',
          content: '夜宵明细导出失败，请稍后重试',
        })
      }
    }
    finally {
      setIsNightSnackExporting(false)
    }
  }, [
    employeeName,
    filters,
    message,
    selectedRowKeys,
    setSelectedRowKeys,
    total,
  ])
  return {
    handleExport,
    handleNightSnackExport,
    isExporting,
    isNightSnackExporting,
    preloadProductionOrderExcel,
    preloadProductionOrderNightSnackExcel,
  }
}
