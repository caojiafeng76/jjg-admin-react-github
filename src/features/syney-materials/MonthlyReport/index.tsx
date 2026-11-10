import type { Dayjs } from 'dayjs'
import { useQueryClient } from '@tanstack/react-query'
import { App, DatePicker } from 'antd'
import dayjs from 'dayjs'
import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useTableHeight } from '@/hooks/useTableHeight'
import ExportButton from '@/ui/ExportButton'
import { TableState } from '@/ui/TableState'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import { loadSyneyMaterialsExcel, preloadSyneyMaterialsExcel } from '../loadSyneyMaterialsExcel'
import { SYNEY_MATERIALS_MONTHLY_REPORT_PERMISSION_KEY } from '../permissions'
import {
  formatSyneyMaterialsReportMonth,
  normalizeSyneyMaterialsReportMonth,
} from './reportUtils'
import SyneyMaterialsMonthlyReportTable from './SyneyMaterialsMonthlyReportTable'
import {
  syneyMaterialsMonthlyReportQueryOptions,
  useSyneyMaterialsMonthlyReport,
} from './useSyneyMaterialsMonthlyReport'

function disableFutureMonth(current: Dayjs) {
  return current.isAfter(dayjs(), 'month')
}

export default function SyneyMaterialsMonthlyReportPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [isExporting, setIsExporting] = useState(false)

  const [searchParams, setSearchParams] = useSearchParams()
  const month = normalizeSyneyMaterialsReportMonth(searchParams.get('month'))

  const { data, isLoading, isFetching, error, refetch }
    = useSyneyMaterialsMonthlyReport(month)

  const { tableContainerRef, scrollY, rowHeight } = useTableHeight({
    targetRowCount: 10,
    summaryRowHeight: 40,
    reservePaginationHeight: false,
  })

  const handleMonthChange = useCallback(
    (value: Dayjs | null) => {
      if (!value)
        return
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.set('month', value.format('YYYY-MM'))
        return next
      }, { replace: true })
    },
    [setSearchParams],
  )

  const handleExport = useCallback(async () => {
    setIsExporting(true)
    try {
      const [rows, { exportSyneyMaterialsReportToExcel }] = await Promise.all([
        queryClient.query(syneyMaterialsMonthlyReportQueryOptions(month)),
        loadSyneyMaterialsExcel(),
      ])
      if (rows.length === 0) {
        message.warning('当前没有可导出的材料库存数据')
        return
      }
      exportSyneyMaterialsReportToExcel(rows, month)
      message.success(
        feedbackText.exported(`${formatSyneyMaterialsReportMonth(month)}库存记录`, rows.length),
      )
    }
    catch (exportError) {
      message.error(
        getUserErrorMessage(exportError, feedbackText.failed('导出', '西尼材料月度报表')),
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
          onChange={handleMonthChange}
          aria-label="报表月份"
        />
        <ExportButton
          handleExport={handleExport}
          loading={isExporting}
          permissionKey={SYNEY_MATERIALS_MONTHLY_REPORT_PERMISSION_KEY}
          onPreload={preloadSyneyMaterialsExcel}
        >
          导出月度报表
        </ExportButton>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          上月结余由当前库存与出入库、调整记录倒推；直接修改或导入库存时的差额计入当月「本月调整」
        </span>
      </div>

      <div
        ref={tableContainerRef}
        className="min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        <TableState loading={isLoading && !data} error={error} onRetry={refetch}>
          <SyneyMaterialsMonthlyReportTable
            loading={isFetching}
            data={data ?? []}
            scrollY={scrollY}
            rowHeight={rowHeight}
          />
        </TableState>
      </div>
    </div>
  )
}
