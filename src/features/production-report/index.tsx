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
import ProductionDailyReportMobileList from './ProductionDailyReportMobileList'
import { useProductionDailyReport } from './useProductionDailyReport'
import { useAuth } from '@/contexts/AuthContext'

function buildDateRange(filters: ProductionDailyReportFilters) {
  if (!filters.startDate || !filters.endDate) {
    return undefined
  }

  return [dayjs(filters.startDate), dayjs(filters.endDate)]
}

export default function ProductionDailyReportPage() {
  const { message } = App.useApp()
  const { role, employeeProfile } = useAuth()
  const isEmployeeView = role === 'employee'
  const fixedEmployeeId = isEmployeeView ? employeeProfile?.id : undefined
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
    employeeId: fixedEmployeeId,
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
      const normalizedFilters = fixedEmployeeId
        ? { ...nextFilters, employeeId: fixedEmployeeId }
        : nextFilters

      setFilters(normalizedFilters)
      updateUrlParams(normalizedFilters)
      setSelectedRowKeys([])
      setSelectedRowsMap({})
    },
    [fixedEmployeeId, updateUrlParams],
  )

  const handleReset = useCallback(() => {
    const nextFilters = fixedEmployeeId ? { employeeId: fixedEmployeeId } : {}
    setFilters(nextFilters)
    updateUrlParams(nextFilters)
    setSelectedRowKeys([])
    setSelectedRowsMap({})
  }, [fixedEmployeeId, updateUrlParams])

  useEffect(() => {
    if (fixedEmployeeId) {
      setFilters((prev) => ({ ...prev, employeeId: fixedEmployeeId }))
    }
  }, [fixedEmployeeId])

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
    <div
      className={
        isEmployeeView
          ? 'grid h-full grid-rows-[auto_auto_1fr_auto] gap-3 p-3'
          : 'grid h-full grid-rows-[auto_auto_1fr_auto] gap-4'
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        {isEmployeeView ? null : (
          <ExportButton
            handleExport={handleExport}
            loading={isFetching}
            count={selectedRowKeys.length}
          />
        )}
      </div>

      <div
        className={
          isEmployeeView
            ? 'rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_10px_25px_rgba(15,23,42,0.06)]'
            : ''
        }
      >
        {isEmployeeView ? (
          <div className="mb-3">
            <div className="text-xs tracking-[0.24em] text-slate-400 uppercase">
              Filter
            </div>
            <div className="mt-1 text-lg font-bold tracking-tight text-slate-900">
              筛选我的日报
            </div>
          </div>
        ) : null}
        <ProductionDailyReportSearch
          initialValues={initialSearchValues}
          onSearch={handleSearch}
          onReset={handleReset}
          mobile={isEmployeeView}
        />
      </div>

      <div
        ref={tableContainerRef}
        className={
          isEmployeeView
            ? 'no-scrollbar min-h-0 overflow-y-auto'
            : 'min-h-0 overflow-hidden'
        }
      >
        {isEmployeeView ? (
          <ProductionDailyReportMobileList
            loading={isLoading || isFetching}
            data={currentPageRows}
            operations={data?.operations || []}
          />
        ) : (
          <ProductionDailyReportTable
            loading={isLoading || isFetching}
            data={currentPageRows}
            operations={data?.operations || []}
            page={page}
            pageSize={pageSize}
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
        )}
      </div>

      <div
        ref={paginationRef}
        className={
          isEmployeeView ? 'flex justify-center pb-1' : 'flex justify-end'
        }
      >
        <AppPagination total={allRows.length} />
      </div>
    </div>
  )
}
