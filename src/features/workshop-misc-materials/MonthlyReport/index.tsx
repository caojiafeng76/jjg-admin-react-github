import type { Dayjs } from 'dayjs'
import type { WorkshopMiscMaterialsReportStage } from '@/services/apiWorkshopMiscMaterialsReport'
import { useQueryClient } from '@tanstack/react-query'
import { App, DatePicker, Segmented, Select } from 'antd'
import dayjs from 'dayjs'
import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useTableHeight } from '@/hooks/useTableHeight'
import ExportButton from '@/ui/ExportButton'
import { FILTER_INPUT_WIDTH_CLASSES } from '@/ui/filterBarTokens'
import { TableState } from '@/ui/TableState'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import {
  loadWorkshopMiscMaterialsExcel,
  preloadWorkshopMiscMaterialsExcel,
} from '../loadWorkshopMiscMaterialsExcel'
import { WORKSHOP_MISC_MATERIALS_MONTHLY_REPORT_PERMISSION_KEY } from '../permissions'
import { useWorkshopMiscMaterialsCategories } from '../useWorkshopMiscMaterialsCategories'
import {
  formatWorkshopMiscReportMonth,
  normalizeWorkshopMiscReportMonth,
  normalizeWorkshopMiscReportStage,
  WORKSHOP_MISC_REPORT_STAGE_OPTIONS,
} from './reportUtils'
import {
  useWorkshopMiscMaterialsMonthlyReport,
  workshopMiscMaterialsMonthlyReportQueryOptions,
} from './useWorkshopMiscMaterialsMonthlyReport'
import WorkshopMiscMaterialsMonthlyReportTable from './WorkshopMiscMaterialsMonthlyReportTable'

function disableFutureMonth(current: Dayjs) {
  return current.isAfter(dayjs(), 'month')
}

export default function WorkshopMiscMaterialsMonthlyReportPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [isExporting, setIsExporting] = useState(false)

  const [searchParams, setSearchParams] = useSearchParams()
  const month = normalizeWorkshopMiscReportMonth(searchParams.get('month'))
  const stage = normalizeWorkshopMiscReportStage(searchParams.get('stage'))
  const category = searchParams.get('category')?.trim() || undefined

  const { data: categories = [] } = useWorkshopMiscMaterialsCategories()
  const categoryOptions = useMemo(
    () => categories.map(value => ({ value, label: value })),
    [categories],
  )

  const { data: rawRows, isLoading, isFetching, error, refetch }
    = useWorkshopMiscMaterialsMonthlyReport(month, stage)

  const data = useMemo(() => {
    if (!rawRows)
      return undefined
    if (!category)
      return rawRows
    return rawRows.filter(row => row.category === category)
  }, [category, rawRows])

  const { tableContainerRef, scrollY, rowHeight } = useTableHeight({
    targetRowCount: 10,
    summaryRowHeight: 40,
    reservePaginationHeight: false,
  })

  const updateParam = useCallback(
    (key: 'month' | 'stage' | 'category', value?: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        if (value) {
          next.set(key, value)
        }
        else {
          next.delete(key)
        }
        return next
      }, { replace: true })
    },
    [setSearchParams],
  )

  const handleExport = useCallback(async () => {
    setIsExporting(true)
    try {
      const [allRows, { exportWorkshopMiscMaterialsReportToExcel }]
        = await Promise.all([
          queryClient.query(
            workshopMiscMaterialsMonthlyReportQueryOptions(month, stage),
          ),
          loadWorkshopMiscMaterialsExcel(),
        ])
      const rows = category
        ? allRows.filter(row => row.category === category)
        : allRows

      if (rows.length === 0) {
        message.warning('当前没有可导出的材料库存数据')
        return
      }
      exportWorkshopMiscMaterialsReportToExcel(rows, { month, stage, category })
      message.success(
        feedbackText.exported(
          `${formatWorkshopMiscReportMonth(month)}库存记录`,
          rows.length,
        ),
      )
    }
    catch (exportError) {
      message.error(
        getUserErrorMessage(
          exportError,
          feedbackText.failed('导出', '车间杂项材料月度报表'),
        ),
      )
    }
    finally {
      setIsExporting(false)
    }
  }, [category, message, month, queryClient, stage])

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
            value && updateParam('month', value.format('YYYY-MM'))}
          aria-label="报表月份"
        />
        <Segmented<WorkshopMiscMaterialsReportStage>
          value={stage}
          onChange={value => updateParam('stage', value)}
          options={WORKSHOP_MISC_REPORT_STAGE_OPTIONS}
          aria-label="统计维度"
        />
        <Select
          allowClear
          showSearch
          placeholder="全部类别"
          aria-label="类别筛选"
          className={FILTER_INPUT_WIDTH_CLASSES.short}
          value={category}
          options={categoryOptions}
          onChange={value => updateParam('category', value)}
        />
        <ExportButton
          handleExport={handleExport}
          loading={isExporting}
          permissionKey={WORKSHOP_MISC_MATERIALS_MONTHLY_REPORT_PERMISSION_KEY}
          onPreload={preloadWorkshopMiscMaterialsExcel}
        >
          导出月度报表
        </ExportButton>
        <span className="text-xs text-text-secondary">
          上月结余由当前库存与出入库、调整记录倒推；直接修改或导入库存时的差额计入当月「本月调整」
        </span>
      </div>

      <div ref={tableContainerRef} className="min-h-0 flex-1 overflow-hidden">
        <TableState loading={isLoading && !data} error={error} onRetry={refetch}>
          <WorkshopMiscMaterialsMonthlyReportTable
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
