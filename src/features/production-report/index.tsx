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
import { getProductionDailyReportForExport } from '@/services/apiProductionDailyReport'
import {
  startProductionDailyReportExportTask,
  waitForProductionDailyReportExportTask,
} from '@/services/apiProductionDailyReportExport'
import { exportProductionDailyReportToExcel } from '@/utils/productionDailyReportExcel'
import { isEmployeeSideRole } from '@/config/access'
import ProductionDailyReportSearch from './ProductionDailyReportSearch'
import ProductionDailyReportTable from './ProductionDailyReportTable'
import ProductionDailyReportMobileList from './ProductionDailyReportMobileList'
import { useProductionDailyReport } from './useProductionDailyReport'
import { useAuth } from '@/contexts/useAuth'

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
      let asyncTaskStarted = false

      try {
        const { jobId } = await startProductionDailyReportExportTask({
          selectedIds:
            selectedRowKeys.length > 0
              ? selectedRowKeys.map((key) => String(key))
              : undefined,
          filters: selectedRowKeys.length > 0 ? undefined : filters,
        })
        asyncTaskStarted = true

        message.open({
          key: 'production-daily-report-export',
          type: 'loading',
          content: '正在后台生成生产日报导出文件，请稍候...',
          duration: 0,
        })

        const exportJob = await waitForProductionDailyReportExportTask(jobId)
        const link = document.createElement('a')

        link.href = exportJob.downloadUrl!
        link.click()

        message.success({
          key: 'production-daily-report-export',
          content: `已导出 ${exportCount} 条日报数据`,
        })
      } catch (asyncExportError) {
        if (asyncTaskStarted) {
          throw asyncExportError
        }

        const exportRows =
          selectedRowKeys.length > 0
            ? selectedRows
            : (await getProductionDailyReportForExport(filters)).rows

        exportCount = exportRows.length
        await exportProductionDailyReportToExcel(exportRows)
        message.destroy('production-daily-report-export')
        message.success(`已导出 ${exportCount} 条日报数据`)

        if (asyncExportError instanceof Error) {
          console.warn('后台导出任务不可用，已回退为前端导出', asyncExportError)
        }
      }

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
          : 'grid h-full grid-rows-[auto_auto_1fr_auto] gap-4'
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        {isEmployeeView ? null : (
          <ExportButton
            handleExport={handleExport}
            loading={isExporting}
            disabled={selectedRowKeys.length === 0 && total === 0}
          >
            {selectedRowKeys.length > 0
              ? `导出选中项 (${selectedRowKeys.length})`
              : `导出当前筛选结果${total > 0 ? ` (${total})` : ''}`}
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
        <AppPagination total={total} />
      </div>
    </div>
  )
}
