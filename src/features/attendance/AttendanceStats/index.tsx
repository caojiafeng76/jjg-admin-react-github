import type { TableColumnsType } from 'antd'
import type { Dayjs } from 'dayjs'
import type {
  AttendanceLateEarlyStat,
  AttendanceShiftStat,
} from '@/services/apiAttendanceDetails'
import type { StatusTone } from '@/ui/StatusPill'
import { ArrowDownTrayIcon as ArrowDownTrayIconSolid } from '@heroicons/react/16/solid'
import {
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import {
  App,
  Button,
  DatePicker,
  Popover,
  Table,
  Tabs,
} from 'antd'

import { useState } from 'react'
import { useTableHeight } from '@/hooks/useTableHeight'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import {
  getAttendanceLateEarlyStats,
  getAttendanceMonthlyExportData,
} from '@/services/apiAttendanceDetails'
import FilterBar from '@/ui/FilterBar'
import StatusPill from '@/ui/StatusPill'
import { TableEmpty, TableState } from '@/ui/TableState'
import { zebraRowClassName } from '@/ui/tableStyles'
import {
  useAttendanceLateEarlyStats,
  useAttendanceShiftStats,
} from '../AttendanceDetail/useAttendanceDetails'
import AttendanceStatsSearch from './AttendanceStatsSearch'

interface SearchParams {
  name?: string
  startDate?: string
  endDate?: string
}

const SHIFT_STATS_TABLE_SCROLL_X = 530
const LATE_EARLY_TABLE_SCROLL_X = 460

function loadAttendanceMonthlyExcel() {
  return import('@/utils/attendanceMonthlyExcel')
}

function preloadAttendanceMonthlyExcel() {
  void loadAttendanceMonthlyExcel()
}

function DatesPopover({
  count,
  dates,
  tone,
}: {
  count: number
  dates: string[]
  tone: StatusTone
}) {
  if (count === 0)
    return <span className="text-slate-400 dark:text-slate-500">0</span>
  return (
    <Popover
      content={(
        <div className="flex max-w-xs flex-wrap gap-1.5">
          {dates.map(d => (
            <StatusPill key={d} tone={tone}>
              {d}
            </StatusPill>
          ))}
        </div>
      )}
      title="涉及日期"
      trigger="click"
    >
      <button type="button" className="cursor-pointer border-0 bg-transparent p-0">
        <StatusPill tone={tone}>{count} 次</StatusPill>
      </button>
    </Popover>
  )
}

const shiftStatsColumns: TableColumnsType<AttendanceShiftStat> = [
  {
    title: '#',
    key: '#',
    width: 60,
    fixed: 'left',
    render: (_v, _r, i) => (
      <span className="flex size-7 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-500 tabular-nums dark:bg-slate-800 dark:text-slate-400">
        {i + 1}
      </span>
    ),
  },
  {
    title: (
      <span className="flex items-center gap-1.5">
        <UserCircleIcon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
        姓名
      </span>
    ),
    dataIndex: 'name',
    key: 'name',
    width: 140,
    fixed: 'left',
    render: (value: string) => (
      <span className="font-medium text-slate-700 dark:text-slate-200">
        {value}
      </span>
    ),
  },
  {
    title: '出勤天数',
    dataIndex: 'total_days',
    key: 'total_days',
    width: 110,
    align: 'center',
    render: (v: number) => (
      <span className="font-semibold text-slate-700 tabular-nums dark:text-slate-200">
        {v}
      </span>
    ),
  },
  {
    title: '白班天数',
    dataIndex: 'day_shift_days',
    key: 'day_shift_days',
    width: 110,
    align: 'center',
    render: (v: number) => <StatusPill tone="neutral">{v}</StatusPill>,
  },
  {
    title: '夜班天数',
    dataIndex: 'night_shift_days',
    key: 'night_shift_days',
    width: 110,
    align: 'center',
    render: (v: number) => <StatusPill tone="info">{v}</StatusPill>,
  },
]

const lateEarlyColumns: TableColumnsType<AttendanceLateEarlyStat> = [
  {
    title: '#',
    key: '#',
    width: 60,
    fixed: 'left',
    render: (_v, _r, i) => (
      <span className="flex size-7 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-500 tabular-nums dark:bg-slate-800 dark:text-slate-400">
        {i + 1}
      </span>
    ),
  },
  {
    title: (
      <span className="flex items-center gap-1.5">
        <UserCircleIcon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
        姓名
      </span>
    ),
    dataIndex: 'name',
    key: 'name',
    width: 140,
    fixed: 'left',
    render: (value: string) => (
      <span className="font-medium text-slate-700 dark:text-slate-200">
        {value}
      </span>
    ),
  },
  {
    title: '迟到次数',
    dataIndex: 'late_count',
    key: 'late_count',
    width: 130,
    align: 'center',
    sorter: (a, b) => a.late_count - b.late_count,
    render: (v: number, r) => (
      <DatesPopover count={v} dates={r.late_dates} tone="warning" />
    ),
  },
  {
    title: '早退次数',
    dataIndex: 'early_leave_count',
    key: 'early_leave_count',
    width: 130,
    align: 'center',
    sorter: (a, b) => a.early_leave_count - b.early_leave_count,
    render: (v: number, r) => (
      <DatesPopover count={v} dates={r.early_leave_dates} tone="danger" />
    ),
  },
]

function ShiftStatsTab({ searchParams }: { searchParams: SearchParams }) {
  const { data, isLoading, error, refetch } = useAttendanceShiftStats(searchParams)
  const { tableContainerRef, scrollY } = useTableHeight({ targetRowCount: 14 })

  return (
    <div ref={tableContainerRef} className="min-h-0 overflow-hidden">
      <TableState
        loading={isLoading && !data}
        error={error}
        onRetry={refetch}
      >
        <Table<AttendanceShiftStat>
          size="small"
          loading={isLoading}
          dataSource={data || []}
          rowKey="name"
          pagination={false}
          rowClassName={zebraRowClassName}
          locale={{
            emptyText: (
              <TableEmpty
                title="暂无班次统计数据"
                description="请调整筛选条件后重试"
              />
            ),
          }}
          scroll={{ x: SHIFT_STATS_TABLE_SCROLL_X, y: scrollY }}
          tableLayout="fixed"
          columns={shiftStatsColumns}
        />
      </TableState>
    </div>
  )
}

function LateEarlyTab({ searchParams }: { searchParams: SearchParams }) {
  const { data, isLoading, error, refetch } = useAttendanceLateEarlyStats(searchParams)
  const { tableContainerRef, scrollY } = useTableHeight({ targetRowCount: 14 })

  return (
    <div ref={tableContainerRef} className="min-h-0 overflow-hidden">
      <TableState
        loading={isLoading && !data}
        error={error}
        onRetry={refetch}
      >
        <Table<AttendanceLateEarlyStat>
          size="small"
          loading={isLoading}
          dataSource={data || []}
          rowKey="name"
          pagination={false}
          rowClassName={zebraRowClassName}
          locale={{
            emptyText: (
              <TableEmpty
                title="暂无迟到/早退统计数据"
                description="请调整筛选条件后重试"
              />
            ),
          }}
          scroll={{ x: LATE_EARLY_TABLE_SCROLL_X, y: scrollY }}
          tableLayout="fixed"
          columns={lateEarlyColumns}
        />
      </TableState>
    </div>
  )
}

export default function AttendanceStatsPage() {
  const { message: messageApi } = App.useApp()
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard()
  const [searchParams, setSearchParams] = useState<SearchParams>({})
  const [exportMonth, setExportMonth] = useState<Dayjs | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportingLateEarly, setExportingLateEarly] = useState(false)

  async function handleExportLateEarly() {
    if (viewerDenied) {
      messageApi.warning(viewerOperationTip)
      return
    }

    setExportingLateEarly(true)
    try {
      const [rows, { exportAttendanceLateEarlyExcel }] = await Promise.all([
        getAttendanceLateEarlyStats(searchParams),
        loadAttendanceMonthlyExcel(),
      ])
      if (!rows.length) {
        messageApi.warning('暂无迟到/早退数据')
        return
      }
      exportAttendanceLateEarlyExcel(rows, {
        startDate: searchParams.startDate,
        endDate: searchParams.endDate,
      })
      messageApi.success('导出成功')
    }
    catch (e) {
      messageApi.error(e instanceof Error ? e.message : '导出失败')
    }
    finally {
      setExportingLateEarly(false)
    }
  }

  async function handleExport() {
    if (viewerDenied) {
      messageApi.warning(viewerOperationTip)
      return
    }

    if (!exportMonth) {
      messageApi.warning('请先选择导出月份')
      return
    }
    const year = exportMonth.year()
    const month = exportMonth.month() + 1
    setExporting(true)
    try {
      const [rows, { exportAttendanceMonthlyExcel }] = await Promise.all([
        getAttendanceMonthlyExportData({
          year,
          month,
          name: searchParams.name,
        }),
        loadAttendanceMonthlyExcel(),
      ])
      if (!rows.length) {
        messageApi.warning('该月暂无出勤数据')
        return
      }
      exportAttendanceMonthlyExcel(rows, year, month)
      messageApi.success('导出成功')
    }
    catch (e) {
      messageApi.error(e instanceof Error ? e.message : '导出失败')
    }
    finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      {/* 筛选与导出栏 */}
      <FilterBar className="flex flex-wrap items-center gap-4">
        <AttendanceStatsSearch
          onSearch={setSearchParams}
          onReset={() => setSearchParams({})}
          initialValues={searchParams}
        />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <DatePicker
            picker="month"
            value={exportMonth}
            onChange={setExportMonth}
            placeholder="选择导出月份"
            allowClear
            className="!w-36 rounded-lg"
          />
          <Button
            type="text"
            icon={<ArrowDownTrayIconSolid className="size-4" />}
            loading={exportingLateEarly}
            onClick={handleExportLateEarly}
            onMouseEnter={preloadAttendanceMonthlyExcel}
            onFocus={preloadAttendanceMonthlyExcel}
            disabled={viewerDenied}
          >
            导出迟到/早退
          </Button>
          <Button
            type="text"
            icon={<ArrowDownTrayIconSolid className="size-4" />}
            loading={exporting}
            onClick={handleExport}
            onMouseEnter={preloadAttendanceMonthlyExcel}
            onFocus={preloadAttendanceMonthlyExcel}
            disabled={viewerDenied}
          >
            导出出勤月报
          </Button>
        </div>
      </FilterBar>

      {/* 统计概览 */}
      <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <ClipboardDocumentListIcon className="h-4 w-4" />
          <span>考勤统计</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CalendarDaysIcon className="h-4 w-4" />
          <span>
            {searchParams.startDate && searchParams.endDate
              ? `${searchParams.startDate} ~ ${searchParams.endDate}`
              : '全部时间'}
          </span>
        </div>
      </div>

      {/* Tabs 标签页 */}
      <div className="min-h-0 flex-1">
        <Tabs
          className="h-full"
          items={[
            {
              key: 'shift',
              label: (
                <span className="flex items-center gap-1.5">
                  <ClipboardDocumentListIcon className="h-4 w-4" />
                  班次统计
                </span>
              ),
              children: <ShiftStatsTab searchParams={searchParams} />,
            },
            {
              key: 'late-early',
              label: (
                <span className="flex items-center gap-1.5">
                  <CalendarDaysIcon className="h-4 w-4" />
                  迟到/早退
                </span>
              ),
              children: <LateEarlyTab searchParams={searchParams} />,
            },
          ]}
        />
      </div>
    </div>
  )
}
