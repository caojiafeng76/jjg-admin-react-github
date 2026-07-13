import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { App } from 'antd'
import { ArrowDownTrayIcon } from '@heroicons/react/16/solid'
import { useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'

import AppPagination from '@/ui/AppPagination'
import { useTableHeight } from '@/hooks/useTableHeight'
import type {
  ProductionDailyReportFilters,
  ProductionDailyReportRow,
} from '@/services/apiProductionDailyReport'
import {
  getProductionDailyReportForExportChunked,
  PRODUCTION_DAILY_REPORT_CHUNKED_EXPORT_PAGE_SIZE,
} from '@/services/apiProductionDailyReport'
import { isEmployeeSideRole } from '@/config/access'
import ProductionDailyReportSearch from './ProductionDailyReportSearch'
import ProductionDailyReportTable from './ProductionDailyReportTable'
import ProductionDailyReportMobileList from './ProductionDailyReportMobileList'
import { useProductionDailyReport } from './useProductionDailyReport'
import { useAuth } from '@/contexts/useAuth'

const loadProductionDailyReportExcel = () =>
  import('@/utils/productionDailyReportExcel')

const preloadProductionDailyReportExcel = () => {
  void loadProductionDailyReportExcel()
}

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
    productModel: searchParamsURL.get('productModel')?.trim() || undefined,
    customerModel: searchParamsURL.get('customerModel') || undefined,
    operation: searchParamsURL.get('operation') || undefined,
    employeeId: fixedEmployeeId,
  })
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [selectedRowsMap, setSelectedRowsMap] = useState(
    () => new Map<string, ProductionDailyReportRow>(),
  )
  const [isExporting, setIsExporting] = useState(false)

  const { data, isLoading, isFetching } = useProductionDailyReport({
    page,
    pageSize,
    filters,
  })
  const { tableContainerRef, paginationRef, scrollY } = useTableHeight({
    targetRowCount: 10,
    summaryRowHeight: isEmployeeView ? 0 : 39,
  })

  const currentPageRows = useMemo(() => data?.rows || [], [data?.rows])
  const total = data?.total || 0
  const selectedCount = selectedRowKeys.length
  const selectedSummary = useMemo(() => {
    if (selectedCount === 0) {
      return { qualifiedCount: 0, defectCount: 0, matched: 0 }
    }
    const keySet = new Set(selectedRowKeys.map((key) => String(key)))
    let qualifiedCount = 0
    let defectCount = 0
    let matched = 0
    for (const row of currentPageRows) {
      if (keySet.has(String(row.key))) {
        qualifiedCount += Number(row.qualifiedCount || 0)
        defectCount += Number(row.defectCount || 0)
        matched += 1
      }
    }
    return { qualifiedCount, defectCount, matched }
  }, [currentPageRows, selectedCount, selectedRowKeys])
  const selectedRows = useMemo(
    () =>
      selectedRowKeys
        .map((key) => selectedRowsMap.get(String(key)))
        .filter((row): row is ProductionDailyReportRow => Boolean(row)),
    [selectedRowKeys, selectedRowsMap],
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

        if (typeof value === 'string' && value) {
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
      setSelectedRowsMap(new Map())
    },
    [fixedEmployeeId, updateUrlParams],
  )

  const handleReset = useCallback(() => {
    const nextFilters = fixedEmployeeId ? { employeeId: fixedEmployeeId } : {}
    setFilters(nextFilters)
    updateUrlParams(nextFilters)
    setSelectedRowKeys([])
    setSelectedRowsMap(new Map())
  }, [fixedEmployeeId, updateUrlParams])

  useEffect(() => {
    if (fixedEmployeeId) {
      setFilters((prev) => ({ ...prev, employeeId: fixedEmployeeId }))
    }
  }, [fixedEmployeeId])

  const handleRowSelectionChange = useCallback(
    (keys: React.Key[], rows: ProductionDailyReportRow[]) => {
      startTransition(() => {
        setSelectedRowKeys(keys)
        setSelectedRowsMap((prev) => {
          const next = new Map(prev)

          currentPageRows.forEach((row) => {
            next.delete(row.key)
          })

          rows.forEach((row) => {
            next.set(row.key, row)
          })

          return next
        })
      })
    },
    [currentPageRows],
  )

  const handleExport = useCallback(async () => {
    const exportTargetCount =
      selectedRowKeys.length > 0 ? selectedRowKeys.length : total

    if (exportTargetCount === 0) {
      message.warning('当前没有可导出的日报数据')
      return
    }

    try {
      setIsExporting(true)
      let exportCount = exportTargetCount
      const updateProgress = (loaded: number, progressTotal: number) => {
        message.open({
          key: 'production-daily-report-export',
          type: 'loading',
          content: `正在分片读取日报数据 ${loaded}/${progressTotal}，每批 ${PRODUCTION_DAILY_REPORT_CHUNKED_EXPORT_PAGE_SIZE} 条...`,
          duration: 0,
        })
      }

      updateProgress(0, exportTargetCount)

      const exportRows =
        selectedRowKeys.length > 0
          ? selectedRows
          : (
              await getProductionDailyReportForExportChunked(filters, {
                onProgress: ({ loaded, total: progressTotal }) => {
                  updateProgress(loaded, progressTotal)
                },
              })
            ).rows

      exportCount = exportRows.length

      message.open({
        key: 'production-daily-report-export',
        type: 'loading',
        content: `已读取 ${exportCount} 条日报数据，正在生成 Excel...`,
        duration: 0,
      })

      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => resolve())
      })

      const { exportProductionDailyReportToExcel } =
        await loadProductionDailyReportExcel()
      await exportProductionDailyReportToExcel(exportRows)

      message.success({
        key: 'production-daily-report-export',
        content: `已导出 ${exportCount} 条日报数据`,
      })

      if (selectedRowKeys.length > 0) {
        setSelectedRowKeys([])
        setSelectedRowsMap(new Map())
      }
    } catch (error) {
      message.error({
        key: 'production-daily-report-export',
        content: error instanceof Error ? error.message : '导出失败',
      })
    } finally {
      setIsExporting(false)
    }
  }, [filters, message, selectedRowKeys, selectedRows, total])

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(total / pageSize))

    if (page > maxPage) {
      const nextParams = new URLSearchParams(searchParamsURL)
      nextParams.set('page', maxPage.toString())
      setSearchParamsURL(nextParams)
    }
  }, [page, pageSize, searchParamsURL, setSearchParamsURL, total])

  return (
    <div
      className={
        isEmployeeView
          ? 'grid h-full grid-rows-[auto_auto_1fr_auto] gap-3 p-3'
          : 'flex h-full flex-col gap-3 overflow-hidden'
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        {isEmployeeView ? null : (
          <>
            <button
              type="button"
              onClick={handleExport}
              onMouseEnter={preloadProductionDailyReportExcel}
              onFocus={preloadProductionDailyReportExcel}
              disabled={isExporting || (selectedCount === 0 && total === 0)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/60 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50/40 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              {selectedCount > 0
                ? `导出选中项 (${selectedCount})`
                : `导出当前筛选结果${total > 0 ? ` (${total})` : ''}`}
            </button>
            {isExporting ? (
              <span className="text-xs text-slate-400">正在生成文件...</span>
            ) : null}
          </>
        )}
      </div>

      {!isEmployeeView && selectedCount > 0 ? (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 overflow-hidden rounded-2xl border border-blue-200/60 bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-blue-50/80 px-5 py-3 shadow-[0_8px_30px_rgba(59,130,246,0.12)] backdrop-blur-sm">
          <span className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100">
              <svg
                className="h-3.5 w-3.5 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            已选
            <span className="mx-1 text-lg font-bold text-blue-600">
              {selectedCount}
            </span>
            条
            {selectedSummary.matched < selectedCount ? (
              <span className="ml-1 text-xs text-amber-600">
                （当前页参与合计 {selectedSummary.matched} 条）
              </span>
            ) : null}
          </span>
          <span className="flex items-center gap-2 text-sm text-slate-600">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100">
              <svg
                className="h-3.5 w-3.5 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            合格数合计：
            <span className="text-xl font-bold text-emerald-600 tabular-nums">
              {selectedSummary.qualifiedCount.toLocaleString()}
            </span>
          </span>
          <span className="flex items-center gap-2 text-sm text-slate-600">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-100">
              <svg
                className="h-3.5 w-3.5 text-rose-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>
            不良数合计：
            <span className="text-xl font-bold text-rose-600 tabular-nums">
              {selectedSummary.defectCount.toLocaleString()}
            </span>
          </span>
        </div>
      ) : null}

      <div
        className={
          isEmployeeView
            ? 'rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_10px_25px_rgba(15,23,42,0.06)]'
            : 'rounded-lg border border-slate-200/60 bg-white p-4 shadow-sm'
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
            : 'min-h-0 flex-1 overflow-hidden'
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
          isEmployeeView
            ? 'flex justify-center pb-1'
            : 'flex shrink-0 justify-end'
        }
      >
        <AppPagination total={total} />
      </div>
    </div>
  )
}
