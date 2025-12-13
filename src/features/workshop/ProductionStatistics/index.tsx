import { useCallback, useEffect, useState } from 'react'
import { App } from 'antd'
import { useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'

import ExportButton from '@/ui/ExportButton'
import AppPagination from '@/ui/AppPagination'
import { useTableHeight } from '@/hooks/useTableHeight'
import ProductionStatisticsSearch from './ProductionStatisticsSearch'
import ProductionStatisticsTable from './ProductionStatisticsTable'
import {
  useProductionStatistics,
  type ProductionStatisticsSearchParams,
} from './useProductionStatistics'
import { useExportProductionStatisticsAsExcel } from './useExportProductionStatisticsAsExcel'

export default function ProductionStatisticsFeature() {
  const { message } = App.useApp()
  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 20
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [searchParams, setSearchParams] = useState<ProductionStatisticsSearchParams>(() => {
    const start = dayjs().startOf('month').format('YYYY-MM-DD')
    const end = dayjs().endOf('month').format('YYYY-MM-DD')
    return {
      startDate: start,
      endDate: end,
    }
  })

  const { data, isLoading } = useProductionStatistics(searchParams)
  const { exportProductionStatisticsAsExcel, isExporting, contextHolder } =
    useExportProductionStatisticsAsExcel(message)

  const rows = data?.rows || []
  const defectReasonColumns = data?.defectReasonColumns || []
  const processColumns = data?.processColumns || []

  const paginatedRows = rows.slice((page - 1) * pageSize, page * pageSize)
  const { tableContainerRef, paginationRef, scrollY } = useTableHeight({
    targetRowCount: pageSize,
    headerHeight: 39,
    summaryRowHeight: 40,
    gap: 12, // gap-3 = 12px
  })

  const handleSearch = useCallback(
    (params: ProductionStatisticsSearchParams) => {
      setSelectedRowKeys([])
      setSearchParams(params)
      searchParamsURL.set('page', '1')
      setSearchParamsURL(searchParamsURL)
    },
    [searchParamsURL, setSearchParamsURL],
  )

  const handleReset = useCallback(() => {
    setSelectedRowKeys([])
    const start = dayjs().startOf('month').format('YYYY-MM-DD')
    const end = dayjs().endOf('month').format('YYYY-MM-DD')
    setSearchParams({
      startDate: start,
      endDate: end,
    })
    searchParamsURL.set('page', '1')
    searchParamsURL.set('pageSize', pageSize.toString())
    setSearchParamsURL(searchParamsURL)
  }, [pageSize, searchParamsURL, setSearchParams, setSearchParamsURL])

  const handleExport = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择至少一条统计数据')
      return
    }
    const selectedRows = rows.filter((row) => selectedRowKeys.includes(row.key))
    exportProductionStatisticsAsExcel(
      selectedRows,
      defectReasonColumns,
      processColumns,
      {
        startDate: searchParams.startDate,
        endDate: searchParams.endDate,
      },
    )
  }, [
    selectedRowKeys,
    rows,
    defectReasonColumns,
    processColumns,
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

  useEffect(() => {
    const totalPages = Math.max(Math.ceil(rows.length / pageSize), 1)
    if (page > totalPages) {
      searchParamsURL.set('page', totalPages.toString())
      setSearchParamsURL(searchParamsURL)
    }
  }, [page, pageSize, rows.length, searchParamsURL, setSearchParamsURL])

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

      <div ref={tableContainerRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
        <ProductionStatisticsTable
          loading={isLoading}
          data={paginatedRows}
          defectReasonColumns={defectReasonColumns}
          processColumns={processColumns}
          selectedRowKeys={selectedRowKeys}
          onSelect={setSelectedRowKeys}
          scrollY={scrollY}
        />
        <div ref={paginationRef} className="flex shrink-0 justify-end">
          <AppPagination
            total={rows.length}
            pageSizeOptions={['10', '20', '30', '50', '100', '200']}
            defaultPageSize={20}
          />
        </div>
      </div>
    </div>
  )
}

