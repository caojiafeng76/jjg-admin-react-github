import { useCallback, useMemo, useState } from 'react'
import { App, Button, Space } from 'antd'
import { useSearchParams } from 'react-router-dom'

import { useTableHeight } from '@/hooks/useTableHeight'
import type {
  ExtrusionProductionDailyReportFilters,
} from '@/services/apiExtrusionProductionDailyReport'
import {
  getExtrusionProductionDailyReportForExport,
} from '@/services/apiExtrusionProductionDailyReport'
import ExtrusionProductionDailyReportSearch from './ExtrusionProductionDailyReportSearch'
import ExtrusionProductionDailyReportTable from './ExtrusionProductionDailyReportTable'
import { useExtrusionProductionDailyReport } from './useExtrusionProductionDailyReport'

const loadExtrusionProductionDailyReportExcel = () =>
  import('@/utils/extrusionProductionDailyReportExcel')

const preloadExtrusionProductionDailyReportExcel = () => {
  void loadExtrusionProductionDailyReportExcel()
}

export default function ExtrusionProductionDailyReportPage() {
  const { message } = App.useApp()
  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [searchFilters, setSearchFilters] =
    useState<ExtrusionProductionDailyReportFilters>({})
  const [isExporting, setIsExporting] = useState(false)

  const { data, isLoading, isFetching } = useExtrusionProductionDailyReport({
    page,
    pageSize,
    filters: searchFilters,
  })

  const { tableContainerRef, paginationRef, scrollY } = useTableHeight({
    targetRowCount: 10,
  })

  const records = useMemo(
    () => data?.rows || [],
    [data?.rows],
  )
  const total = data?.total || 0

  const handleSearch = useCallback(
    (filters: ExtrusionProductionDailyReportFilters) => {
      setSearchFilters(filters)
      setSelectedRowKeys([])
      searchParamsURL.set('page', '1')
      setSearchParamsURL(searchParamsURL)
    },
    [searchParamsURL, setSearchParamsURL],
  )

  const handleResetSearch = useCallback(() => {
    setSearchFilters({})
    setSelectedRowKeys([])
    searchParamsURL.set('page', '1')
    searchParamsURL.delete('pageSize')
    setSearchParamsURL(searchParamsURL)
  }, [searchParamsURL, setSearchParamsURL])

  const handleRowSelectionChange = useCallback(
    (keys: React.Key[]) => {
      setSelectedRowKeys(keys)
    },
    [],
  )

  const handleExportExcel = useCallback(async () => {
    try {
      setIsExporting(true)
      message.loading({ content: '正在导出...', key: 'export' })

      const exportRows = await getExtrusionProductionDailyReportForExport(
        searchFilters,
      )

      if (exportRows.length === 0) {
        message.warning({ content: '没有可导出的数据', key: 'export' })
        return
      }

      const { exportExtrusionProductionDailyReportToExcel } =
        await loadExtrusionProductionDailyReportExcel()
      exportExtrusionProductionDailyReportToExcel(exportRows)
      message.success({ content: '导出成功', key: 'export' })
    } catch (error) {
      message.error({
        content: error instanceof Error ? error.message : '导出失败',
        key: 'export',
      })
    } finally {
      setIsExporting(false)
    }
  }, [message, searchFilters])

  const handlePageChange = useCallback(
    (newPage: number, newPageSize: number) => {
      setSelectedRowKeys([])
      const params = new URLSearchParams(searchParamsURL.toString())
      params.set('page', String(newPage))
      if (newPageSize !== pageSize) {
        params.set('pageSize', String(newPageSize))
        params.set('page', '1')
      }
      setSearchParamsURL(params)
    },
    [pageSize, searchParamsURL, setSearchParamsURL],
  )

  return (
    <div className="flex h-full flex-col gap-4">
      <ExtrusionProductionDailyReportSearch
        onSearch={handleSearch}
        onReset={handleResetSearch}
      />

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          共 {total} 条记录
          {selectedRowKeys.length > 0 && (
            <span className="ml-2">已选择 {selectedRowKeys.length} 条</span>
          )}
        </div>
        <Space>
          <Button
            onClick={handleExportExcel}
            onMouseEnter={preloadExtrusionProductionDailyReportExcel}
            onFocus={preloadExtrusionProductionDailyReportExcel}
            loading={isExporting}
          >
            导出Excel
          </Button>
        </Space>
      </div>

      <div ref={tableContainerRef} className="flex-1">
        <ExtrusionProductionDailyReportTable
          loading={isLoading || isFetching}
          data={records}
          page={page}
          pageSize={pageSize}
          selectedRowKeys={selectedRowKeys}
          onRowSelectionChange={handleRowSelectionChange}
          scrollY={scrollY}
        />
      </div>

      <div ref={paginationRef}>
        {total > 0 && (
          <div className="flex justify-end">
            <Button
              onClick={() => handlePageChange(1, pageSize)}
              disabled={page === 1}
              size="small"
            >
              首页
            </Button>
            <Button
              onClick={() => handlePageChange(page - 1, pageSize)}
              disabled={page === 1}
              size="small"
            >
              上一页
            </Button>
            <span className="flex items-center px-4">
              第 {page} / {Math.ceil(total / pageSize)} 页
            </span>
            <Button
              onClick={() => handlePageChange(page + 1, pageSize)}
              disabled={page >= Math.ceil(total / pageSize)}
              size="small"
            >
              下一页
            </Button>
            <Button
              onClick={() =>
                handlePageChange(Math.ceil(total / pageSize), pageSize)
              }
              disabled={page >= Math.ceil(total / pageSize)}
              size="small"
            >
              末页
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
