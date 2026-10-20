import type { StandardTimeSearchParams } from './useStandardTimeSearchParams'
import type { StandardTime } from '@/services/apiStandardTimes'
import { App } from 'antd'
import { useCallback, useState } from 'react'

import { getProcessStandardImageExportFile } from '@/services/apiProcessStandardImages'
import { getAllStandardTimesForExport } from '@/services/apiStandardTimes'

const loadCostAccountingExcel = () => import('@/utils/costAccountingExcel')

export function preloadCostAccountingExcel() {
  void loadCostAccountingExcel()
}

function loadPrecisionFinishingProcessExcel() {
  return import('@/utils/precisionFinishingProcessExcel')
}

export function preloadPrecisionFinishingProcessExcel() {
  void loadPrecisionFinishingProcessExcel()
}

export interface UseStandardTimeExportOptions {
  items: StandardTime[] | undefined
  selectedRowKeys: React.Key[]
  searchParams: StandardTimeSearchParams
}

/** 成本核算 / 工艺表的「导出已选」与「按筛选条件导出」 */
export function useStandardTimeExport({
  items,
  selectedRowKeys,
  searchParams,
}: UseStandardTimeExportOptions) {
  const { message } = App.useApp()
  const [isExporting, setIsExporting] = useState(false)
  const [isFilterExporting, setIsFilterExporting] = useState(false)
  const [isProcessExporting, setIsProcessExporting] = useState(false)
  const [isProcessFilterExporting, setIsProcessFilterExporting]
    = useState(false)

  const handleExport = useCallback(async () => {
    const selectedSet = new Set(selectedRowKeys)
    const selectedRecords = (items || []).filter(item =>
      selectedSet.has(item.id || ''),
    )

    if (selectedRecords.length === 0) {
      message.warning('请先选择要导出的成本核算数据')
      return
    }

    setIsExporting(true)
    // 先让 React 渲染 loading 状态，再执行同步的 Excel 生成
    await new Promise<void>(resolve => setTimeout(resolve, 0))
    try {
      const { exportCostAccountingToExcel } = await loadCostAccountingExcel()
      exportCostAccountingToExcel(selectedRecords)
      message.success(`已导出 ${selectedRecords.length} 条成本核算数据`)
    }
    catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      }
      else {
        message.error('导出成本核算失败，请稍后重试')
      }
    }
    finally {
      setIsExporting(false)
    }
  }, [items, message, selectedRowKeys])

  const handleFilterExport = useCallback(async () => {
    setIsFilterExporting(true)
    try {
      const records = await getAllStandardTimesForExport(searchParams)
      if (records.length === 0) {
        message.warning('当前筛选条件下无数据可导出')
        return
      }
      await new Promise<void>(resolve => setTimeout(resolve, 0))
      const { exportCostAccountingToExcel } = await loadCostAccountingExcel()
      exportCostAccountingToExcel(records)
      message.success(`已按筛选条件导出 ${records.length} 条成本核算数据`)
    }
    catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      }
      else {
        message.error('导出成本核算失败，请稍后重试')
      }
    }
    finally {
      setIsFilterExporting(false)
    }
  }, [message, searchParams])

  const exportProcessSheet = useCallback(async (records: StandardTime[]) => {
    const { exportPrecisionFinishingProcessToExcel }
      = await loadPrecisionFinishingProcessExcel()

    await exportPrecisionFinishingProcessToExcel(records, async (record) => {
      if (
        !record.process_image_path
        || !record.process_image_name
        || !record.process_image_mime_type
      ) {
        return null
      }

      const image = await getProcessStandardImageExportFile({
        filePath: record.process_image_path,
        fileName: record.process_image_name,
        mimeType: record.process_image_mime_type,
      })

      return { ...image, rowNumber: 0, columnNumber: 12 }
    })
  }, [])

  const handleProcessExport = useCallback(async () => {
    const selectedSet = new Set(selectedRowKeys)
    const selectedRecords = (items || []).filter(item =>
      selectedSet.has(item.id || ''),
    )

    if (selectedRecords.length === 0) {
      message.warning('请先选择要导出的工艺数据')
      return
    }

    setIsProcessExporting(true)
    await new Promise<void>(resolve => setTimeout(resolve, 0))
    try {
      await exportProcessSheet(selectedRecords)
      message.success(`已导出 ${selectedRecords.length} 条工艺数据`)
    }
    catch (error) {
      message.error(
        error instanceof Error ? error.message : '导出工艺表失败，请稍后重试',
      )
    }
    finally {
      setIsProcessExporting(false)
    }
  }, [items, exportProcessSheet, message, selectedRowKeys])

  const handleProcessFilterExport = useCallback(async () => {
    setIsProcessFilterExporting(true)
    try {
      const records = await getAllStandardTimesForExport(searchParams)
      if (records.length === 0) {
        message.warning('当前筛选条件下无工艺数据可导出')
        return
      }

      await new Promise<void>(resolve => setTimeout(resolve, 0))
      await exportProcessSheet(records)
      message.success(`已按筛选条件导出 ${records.length} 条工艺数据`)
    }
    catch (error) {
      message.error(
        error instanceof Error ? error.message : '导出工艺表失败，请稍后重试',
      )
    }
    finally {
      setIsProcessFilterExporting(false)
    }
  }, [exportProcessSheet, message, searchParams])

  return {
    handleExport,
    handleFilterExport,
    handleProcessExport,
    handleProcessFilterExport,
    isExporting,
    isFilterExporting,
    isProcessExporting,
    isProcessFilterExporting,
  }
}
