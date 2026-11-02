import type { Dayjs } from 'dayjs'
import type { JintanMonthlyReportCategory } from '@/services/apiJintanMonthlyReport'
import { useQueryClient } from '@tanstack/react-query'
import { App, DatePicker, Segmented } from 'antd'
import dayjs from 'dayjs'

import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTableHeight } from '@/hooks/useTableHeight'
import {
  JINTAN_MONTHLY_REPORT_CATEGORIES,
  JINTAN_MONTHLY_REPORT_CATEGORY_LABELS,
} from '@/services/apiJintanMonthlyReport'
import ExportButton from '@/ui/ExportButton'
import { TableState } from '@/ui/TableState'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import { JINTAN_MONTHLY_REPORT_PERMISSION_KEY } from '../permissions'
import JintanMonthlyReportTable from './JintanMonthlyReportTable'
import {
  formatJintanReportMonth,
  normalizeJintanReportMonth,
} from './reportUtils'
import {
  jintanMonthlyReportQueryOptions,
  useJintanMonthlyReport,
} from './useJintanMonthlyReport'

function loadJintanMonthlyReportExcel() {
  return import('@/utils/jintanMonthlyReportExcel')
}

function preloadJintanMonthlyReportExcel() {
  void loadJintanMonthlyReportExcel()
}

function isReportCategory(
  value: string | null,
): value is JintanMonthlyReportCategory {
  return JINTAN_MONTHLY_REPORT_CATEGORIES.includes(
    value as JintanMonthlyReportCategory,
  )
}

function disableFutureMonth(current: Dayjs) {
  return current.isAfter(dayjs(), 'month')
}

export default function JintanMonthlyReportPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [isExporting, setIsExporting] = useState(false)

  const [searchParams, setSearchParams] = useSearchParams()
  const month = normalizeJintanReportMonth(searchParams.get('month'))
  const tabParam = searchParams.get('tab')
  const category: JintanMonthlyReportCategory = isReportCategory(tabParam)
    ? tabParam
    : 'parts'
  const categoryLabel = JINTAN_MONTHLY_REPORT_CATEGORY_LABELS[category]

  const { data, isLoading, isFetching, error, refetch }
    = useJintanMonthlyReport(month)

  const { tableContainerRef, scrollY, rowHeight } = useTableHeight({
    targetRowCount: 10,
    summaryRowHeight: 40,
    reservePaginationHeight: false,
  })

  const updateSearchParam = useCallback(
    (key: 'month' | 'tab', value: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set(key, value)
        return next
      }, { replace: true })
    },
    [setSearchParams],
  )

  const handleExport = useCallback(async () => {
    setIsExporting(true)
    try {
      const [report, { exportJintanMonthlyReportToExcel }] = await Promise.all([
        queryClient.query(jintanMonthlyReportQueryOptions(month)),
        loadJintanMonthlyReportExcel(),
      ])

      const total = JINTAN_MONTHLY_REPORT_CATEGORIES.reduce(
        (sum, key) => sum + report[key].length,
        0,
      )
      if (total === 0) {
        message.warning('当前没有可导出的金檀库存数据')
        return
      }

      exportJintanMonthlyReportToExcel(report, month)
      message.success(
        feedbackText.exported(`${formatJintanReportMonth(month)}库存记录`, total),
      )
    }
    catch (exportError) {
      message.error(
        getUserErrorMessage(exportError, feedbackText.failed('导出', '金檀月度报表')),
      )
    }
    finally {
      setIsExporting(false)
    }
  }, [message, month, queryClient])

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      <div className="flex flex-wrap items-center gap-2">
        <DatePicker
          picker="month"
          allowClear={false}
          value={dayjs(`${month}-01`)}
          format="YYYY年M月"
          disabledDate={disableFutureMonth}
          onChange={value =>
            value && updateSearchParam('month', value.format('YYYY-MM'))}
          aria-label="报表月份"
        />
        <ExportButton
          handleExport={handleExport}
          loading={isExporting}
          permissionKey={JINTAN_MONTHLY_REPORT_PERMISSION_KEY}
          onPreload={preloadJintanMonthlyReportExcel}
        >
          导出月度报表
        </ExportButton>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          上月结余由当前库存与出入库记录倒推；库存页直接修改或导入的数量不计入出入库流水
        </span>
      </div>

      <Segmented<JintanMonthlyReportCategory>
        className="self-start"
        value={category}
        onChange={value => updateSearchParam('tab', value)}
        options={JINTAN_MONTHLY_REPORT_CATEGORIES.map(key => ({
          value: key,
          label: `${JINTAN_MONTHLY_REPORT_CATEGORY_LABELS[key]}${
            data ? `（${data[key].length}）` : ''
          }`,
        }))}
      />

      <div
        ref={tableContainerRef}
        className="min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        <TableState loading={isLoading && !data} error={error} onRetry={refetch}>
          <JintanMonthlyReportTable
            loading={isFetching}
            data={data?.[category] ?? []}
            categoryLabel={categoryLabel}
            scrollY={scrollY}
            rowHeight={rowHeight}
          />
        </TableState>
      </div>
    </div>
  )
}
