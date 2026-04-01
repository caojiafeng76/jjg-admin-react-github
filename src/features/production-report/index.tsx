import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
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
import { isEmployeeSideRole } from '@/config/access'
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
  const isEmployeeView = isEmployeeSideRole(role)
  const fixedEmployeeId = isEmployeeView ? employeeProfile?.id : undefined
  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10
  const [filters, setFilters] = useState<ProductionDailyReportFilters>({
    startDate: searchParamsURL.get('startDate') || undefined,
    endDate: searchParamsURL.get('endDate') || undefined,
    dataCategory:
      searchParamsURL.get('dataCategory') === 'A' ||
      searchParamsURL.get('dataCategory') === 'B'
        ? (searchParamsURL.get('dataCategory') as 'A' | 'B')
        : undefined,
    projectNo: searchParamsURL.get('projectNo') || undefined,
    productModel: searchParamsURL.get('productModel') || undefined,
    customerModel: searchParamsURL.get('customerModel') || undefined,
    operation: searchParamsURL.get('operation') || undefined,
    employeeId: fixedEmployeeId,
  })
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [isExporting, setIsExporting] = useState(false)

  const { data, isLoading, isFetching } = useProductionDailyReport(filters)
  const { tableContainerRef, paginationRef, scrollY } = useTableHeight({
    targetRowCount: 10,
    summaryRowHeight: isEmployeeView ? 0 : 39,
  })

  const allRows = data?.rows || []
  const rowsByKey = useMemo(
    () =>
      new Map(
        allRows.map(
          (row) => [row.key, row] satisfies [string, ProductionDailyReportRow],
        ),
      ),
    [allRows],
  )
  const currentPageRows = useMemo(() => {
    const from = (page - 1) * pageSize
    return allRows.slice(from, from + pageSize)
  }, [allRows, page, pageSize])
  const selectedRows = useMemo(
    () =>
      selectedRowKeys
        .map((key) => rowsByKey.get(String(key)))
        .filter((row): row is ProductionDailyReportRow => Boolean(row)),
    [rowsByKey, selectedRowKeys],
  )

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
        ['dataCategory', 'dataCategory'],
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
    },
    [fixedEmployeeId, updateUrlParams],
  )

  const handleReset = useCallback(() => {
    const nextFilters = fixedEmployeeId ? { employeeId: fixedEmployeeId } : {}
    setFilters(nextFilters)
    updateUrlParams(nextFilters)
    setSelectedRowKeys([])
  }, [fixedEmployeeId, updateUrlParams])

  useEffect(() => {
    if (fixedEmployeeId) {
      setFilters((prev) => ({ ...prev, employeeId: fixedEmployeeId }))
    }
  }, [fixedEmployeeId])

  const handleRowSelectionChange = useCallback((keys: React.Key[]) => {
    startTransition(() => {
      setSelectedRowKeys(keys)
    })
  }, [])

  const handleExport = useCallback(async () => {
    const exportRows = selectedRows.length > 0 ? selectedRows : allRows

    if (exportRows.length === 0) {
      message.warning('当前没有可导出的日报数据')
      return
    }

    try {
      setIsExporting(true)
      await exportProductionDailyReportToExcel(exportRows)
      message.success(
        selectedRows.length > 0
          ? `已导出 ${selectedRows.length} 条日报数据`
          : `已导出当前筛选结果 ${allRows.length} 条日报数据`,
      )

      if (selectedRows.length > 0) {
        setSelectedRowKeys([])
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '导出失败')
    } finally {
      setIsExporting(false)
    }
  }, [allRows, message, selectedRows])

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
            loading={isExporting}
            disabled={allRows.length === 0}
          >
            {selectedRowKeys.length > 0
              ? `导出选中项 (${selectedRowKeys.length})`
              : `导出当前筛选结果${allRows.length > 0 ? ` (${allRows.length})` : ''}`}
          </ExportButton>
        )}
      </div>

      <div
        className={
          isEmployeeView
            ? 'rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_10px_25px_rgba(15,23,42,0.06)]'
            : ''
        }
      >
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
            ? 'no-scrollbar min-h-0 overflow-y-auto overscroll-contain'
            : 'min-h-0 overflow-hidden'
        }
      >
        {isEmployeeView ? (
          <ProductionDailyReportMobileList
            loading={isLoading || isFetching}
            data={currentPageRows}
          />
        ) : (
          <ProductionDailyReportTable
            loading={isLoading || isFetching || isExporting}
            data={currentPageRows}
            page={page}
            pageSize={pageSize}
            selectedRowKeys={selectedRowKeys}
            onRowSelectionChange={handleRowSelectionChange}
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
