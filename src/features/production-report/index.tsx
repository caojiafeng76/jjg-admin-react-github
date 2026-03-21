import { useCallback, useEffect, useMemo, useState } from 'react'
import { App } from 'antd'
import { useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'

import AppPagination from '@/ui/AppPagination'
import ExportButton from '@/ui/ExportButton'
import { useTableHeight } from '@/hooks/useTableHeight'
import type {
  ProductionDailyReportFilters,
  ProductionDailyReportRow,
} from '@/services/apiProductionDailyReport'
import { exportProductionDailyReportToExcel } from '@/utils/productionDailyReportExcel'
import ProductionDailyReportSearch from './ProductionDailyReportSearch'
import ProductionDailyReportTable from './ProductionDailyReportTable'
import { useProductionDailyReport } from './useProductionDailyReport'

function buildDateRange(filters: ProductionDailyReportFilters) {
  if (!filters.startDate || !filters.endDate) {
    return undefined
  }

  return [dayjs(filters.startDate), dayjs(filters.endDate)]
}

export default function ProductionDailyReportPage() {
  const { message } = App.useApp()
  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10
  const [filters, setFilters] = useState<ProductionDailyReportFilters>({
    startDate: searchParamsURL.get('startDate') || undefined,
    endDate: searchParamsURL.get('endDate') || undefined,
    projectNo: searchParamsURL.get('projectNo') || undefined,
    productModel: searchParamsURL.get('productModel') || undefined,
    customerModel: searchParamsURL.get('customerModel') || undefined,
    operation: searchParamsURL.get('operation') || undefined,
  })
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [selectedRowsMap, setSelectedRowsMap] = useState<
    Record<string, ProductionDailyReportRow>
  >({})

  const { data, isLoading, isFetching } = useProductionDailyReport(filters)
  const { tableContainerRef, paginationRef, scrollY } = useTableHeight({
    targetRowCount: 10,
  })

  const allRows = data?.rows || []
  const currentPageRows = useMemo(() => {
    const from = (page - 1) * pageSize
    return allRows.slice(from, from + pageSize)
  }, [allRows, page, pageSize])

  const initialSearchValues = useMemo(
    () => ({
      ...filters,
      dateRange: buildDateRange(filters),
    }),
    [filters],
  )

  const updateUrlParams = useCallback(
    (nextFilters: ProductionDailyReportFilters) => {
      const nextParams = new URLSearchParams(searchParamsURL)

      nextParams.set('page', '1')

      const mappings: Array<[keyof ProductionDailyReportFilters, string]> = [
        ['startDate', 'startDate'],
        ['endDate', 'endDate'],
        ['projectNo', 'projectNo'],
        ['productModel', 'productModel'],
        ['customerModel', 'customerModel'],
        ['operation', 'operation'],
      ]

      mappings.forEach(([filterKey, paramKey]) => {
        const value = nextFilters[filterKey]

        if (value) {
          nextParams.set(paramKey, value)
        } else {
          nextParams.delete(paramKey)
        }
      })

      setSearchParamsURL(nextParams)
    },
    [searchParamsURL, setSearchParamsURL],
  )

  const handleSearch = useCallback(
    (nextFilters: ProductionDailyReportFilters) => {
      setFilters(nextFilters)
      updateUrlParams(nextFilters)
      setSelectedRowKeys([])
      setSelectedRowsMap({})
    },
    [updateUrlParams],
  )

  const handleReset = useCallback(() => {
    const nextFilters = {}
    setFilters(nextFilters)
    updateUrlParams(nextFilters)
    setSelectedRowKeys([])
    setSelectedRowsMap({})
  }, [updateUrlParams])

  const handleExport = useCallback(() => {
    const selectedRows = selectedRowKeys
      .map((key) => selectedRowsMap[String(key)])
      .filter((row): row is ProductionDailyReportRow => Boolean(row))

    if (selectedRows.length === 0) {
      message.warning('请先选择要导出的日报数据')
      return
    }

    exportProductionDailyReportToExcel(selectedRows, data?.operations || [])
    message.success(`已导出 ${selectedRows.length} 条日报数据`)
  }, [data?.operations, message, selectedRowKeys, selectedRowsMap])

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(allRows.length / pageSize))

    if (page > maxPage) {
      const nextParams = new URLSearchParams(searchParamsURL)
      nextParams.set('page', maxPage.toString())
      setSearchParamsURL(nextParams)
    }
  }, [allRows.length, page, pageSize, searchParamsURL, setSearchParamsURL])

  return (
    <div className="grid h-full grid-rows-[auto_auto_1fr_auto] gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <ExportButton
          handleExport={handleExport}
          loading={isFetching}
          count={selectedRowKeys.length}
        />
      </div>

      <ProductionDailyReportSearch
        initialValues={initialSearchValues}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      <div ref={tableContainerRef} className="min-h-0 overflow-hidden">
        <ProductionDailyReportTable
          loading={isLoading || isFetching}
          data={currentPageRows}
          operations={data?.operations || []}
          selectedRowKeys={selectedRowKeys}
          onRowSelectionChange={{
            onChange: (keys) => {
              setSelectedRowKeys(keys)
            },
            onSelect: (record, selected) => {
              setSelectedRowsMap((prev) => {
                const next = { ...prev }

                if (selected) {
                  next[record.key] = record
                } else {
                  delete next[record.key]
                }

                return next
              })
            },
            onSelectAll: (selected, _selectedRows, changeRows) => {
              setSelectedRowsMap((prev) => {
                const next = { ...prev }

                changeRows.forEach((row) => {
                  if (selected) {
                    next[row.key] = row
                  } else {
                    delete next[row.key]
                  }
                })

                return next
              })
            },
          }}
          scrollY={scrollY}
        />
      </div>

      <div ref={paginationRef} className="flex justify-end">
        <AppPagination total={allRows.length} />
      </div>
    </div>
  )
}
