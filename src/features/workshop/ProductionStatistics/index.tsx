import { useCallback, useEffect, useState } from 'react'
import { App } from 'antd'

import ExportButton from '@/ui/ExportButton'
import ProductionStatisticsSearch from './ProductionStatisticsSearch'
import ProductionStatisticsTable from './ProductionStatisticsTable'
import {
  useProductionStatistics,
  type ProductionStatisticsSearchParams,
} from './useProductionStatistics'
import { useExportProductionStatisticsAsExcel } from './useExportProductionStatisticsAsExcel'

export default function ProductionStatisticsFeature() {
  const { message } = App.useApp()
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [searchParams, setSearchParams] = useState<ProductionStatisticsSearchParams>(() => {
    const start = new Date()
    start.setDate(1)
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0)
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    }
  })

  const { data, isLoading } = useProductionStatistics(searchParams)
  const { exportProductionStatisticsAsExcel, isExporting, contextHolder } =
    useExportProductionStatisticsAsExcel(message)

  const rows = data?.rows || []
  const defectReasonColumns = data?.defectReasonColumns || []

  const handleSearch = useCallback((params: ProductionStatisticsSearchParams) => {
    setSelectedRowKeys([])
    setSearchParams(params)
  }, [])

  const handleReset = useCallback(() => {
    setSelectedRowKeys([])
    const start = new Date()
    start.setDate(1)
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0)
    setSearchParams({
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    })
  }, [])

  const handleExport = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择至少一条统计数据')
      return
    }
    const selectedRows = rows.filter((row) => selectedRowKeys.includes(row.key))
    exportProductionStatisticsAsExcel(selectedRows, defectReasonColumns, {
      startDate: searchParams.startDate,
      endDate: searchParams.endDate,
    })
  }, [
    selectedRowKeys,
    rows,
    defectReasonColumns,
    exportProductionStatisticsAsExcel,
    message,
    searchParams.startDate,
    searchParams.endDate,
  ])

  useEffect(() => {
    // 数据刷新时，移除已不在列表的选中项
    const currentKeys = new Set<React.Key>(rows.map((row) => row.key))
    setSelectedRowKeys((prev) => prev.filter((key) => currentKeys.has(key)))
  }, [rows])

  return (
    <div className="grid h-full grid-rows-[auto_auto_1fr] gap-4">
      {contextHolder}
      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap text-gray-600">搜索：</span>
        <ProductionStatisticsSearch
          onSearch={handleSearch}
          onReset={handleReset}
          initialStartDate={searchParams.startDate}
          initialEndDate={searchParams.endDate}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ExportButton
          handleExport={handleExport}
          loading={isExporting}
          count={selectedRowKeys.length}
        />
      </div>

      <div className="min-h-0 overflow-hidden">
        <ProductionStatisticsTable
          loading={isLoading}
          data={rows}
          defectReasonColumns={defectReasonColumns}
          selectedRowKeys={selectedRowKeys}
          onSelect={setSelectedRowKeys}
        />
      </div>
    </div>
  )
}

