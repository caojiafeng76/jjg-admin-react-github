import { useState } from 'react'
import {
  Button,
  DatePicker,
  message,
  Popover,
  Table,
  TableColumnsType,
  Tabs,
  Tag,
} from 'antd'
import type { Dayjs } from 'dayjs'
import {
  ClipboardDocumentListIcon,
  UserCircleIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import { ArrowDownTrayIcon as ArrowDownTrayIconSolid } from '@heroicons/react/16/solid'

import { useTableHeight } from '@/hooks/useTableHeight'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import type {
  AttendanceLateEarlyStat,
  AttendanceShiftStat,
} from '@/services/apiAttendanceDetails'
import {
  getAttendanceMonthlyExportData,
  getAttendanceLateEarlyStats,
} from '@/services/apiAttendanceDetails'
import {
  useAttendanceLateEarlyStats,
  useAttendanceShiftStats,
} from '../AttendanceDetail/useAttendanceDetails'
import AttendanceStatsSearch from './AttendanceStatsSearch'

type SearchParams = {
  name?: string
  startDate?: string
  endDate?: string
}

const SHIFT_STATS_TABLE_SCROLL_X = 530
const LATE_EARLY_TABLE_SCROLL_X = 460

const loadAttendanceMonthlyExcel = () =>
  import('@/utils/attendanceMonthlyExcel')

function preloadAttendanceMonthlyExcel() {
  void loadAttendanceMonthlyExcel()
}

function DatesPopover({
  count,
  dates,
  color,
}: {
  count: number
  dates: string[]
  color: string
}) {
  if (count === 0) return <span className="text-slate-400">0</span>
  return (
    <Popover
      content={
        <div className="flex max-w-xs flex-wrap gap-1">
          {dates.map((d) => (
            <Tag key={d} color={color} className="mb-1">
              {d}
            </Tag>
          ))}
        </div>
      }
      title="涉及日期"
      trigger="click"
    >
      <Tag color={color} className="cursor-pointer">
        {count} 次
      </Tag>
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
      <span className="flex size-7 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-500">
        {i + 1}
      </span>
    ),
  },
  {
    title: (
      <span className="flex items-center gap-1.5">
        <UserCircleIcon className="h-4 w-4 text-slate-400" />
        姓名
      </span>
    ),
    dataIndex: 'name',
    key: 'name',
    width: 140,
    fixed: 'left',
    render: (value: string) => (
      <span className="font-medium text-slate-700">{value}</span>
    ),
  },
  {
    title: '出勤天数',
    dataIndex: 'total_days',
    key: 'total_days',
    width: 110,
    align: 'center',
    render: (v: number) => (
      <span className="font-semibold text-slate-700">{v}</span>
    ),
  },
  {
    title: '白班天数',
    dataIndex: 'day_shift_days',
    key: 'day_shift_days',
    width: 110,
    align: 'center',
    render: (v: number) => (
      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
        {v}
      </span>
    ),
  },
  {
    title: '夜班天数',
    dataIndex: 'night_shift_days',
    key: 'night_shift_days',
    width: 110,
    align: 'center',
    render: (v: number) => (
      <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">
        {v}
      </span>
    ),
  },
]

const lateEarlyColumns: TableColumnsType<AttendanceLateEarlyStat> = [
  {
    title: '#',
    key: '#',
    width: 60,
    fixed: 'left',
    render: (_v, _r, i) => (
      <span className="flex size-7 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-500">
        {i + 1}
      </span>
    ),
  },
  {
    title: (
      <span className="flex items-center gap-1.5">
        <UserCircleIcon className="h-4 w-4 text-slate-400" />
        姓名
      </span>
    ),
    dataIndex: 'name',
    key: 'name',
    width: 140,
    fixed: 'left',
    render: (value: string) => (
      <span className="font-medium text-slate-700">{value}</span>
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
      <DatesPopover count={v} dates={r.late_dates} color="orange" />
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
      <DatesPopover count={v} dates={r.early_leave_dates} color="volcano" />
    ),
  },
]

function ShiftStatsTab({ searchParams }: { searchParams: SearchParams }) {
  const { data, isLoading } = useAttendanceShiftStats(searchParams)
  const { tableContainerRef, scrollY } = useTableHeight({ targetRowCount: 14 })

  return (
    <div
      ref={tableContainerRef}
      className="min-h-0 overflow-hidden rounded-xl border border-slate-200/80"
    >
      <Table<AttendanceShiftStat>
        size="small"
        loading={isLoading}
        dataSource={data || []}
        rowKey="name"
        pagination={false}
        scroll={{ x: SHIFT_STATS_TABLE_SCROLL_X, y: scrollY }}
        tableLayout="fixed"
        columns={shiftStatsColumns}
      />
    </div>
  )
}

function LateEarlyTab({ searchParams }: { searchParams: SearchParams }) {
  const { data, isLoading } = useAttendanceLateEarlyStats(searchParams)
  const { tableContainerRef, scrollY } = useTableHeight({ targetRowCount: 14 })

  return (
    <div
      ref={tableContainerRef}
      className="min-h-0 overflow-hidden rounded-xl border border-slate-200/80"
    >
      <Table
        size="small"
        loading={isLoading}
        dataSource={data || []}
        rowKey="name"
        pagination={false}
        scroll={{ x: LATE_EARLY_TABLE_SCROLL_X, y: scrollY }}
        tableLayout="fixed"
        columns={lateEarlyColumns}
      />
    </div>
  )
}

export default function AttendanceStatsPage() {
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard()
  const [searchParams, setSearchParams] = useState<SearchParams>({})
  const [exportMonth, setExportMonth] = useState<Dayjs | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportingLateEarly, setExportingLateEarly] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

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
    } catch (e) {
      messageApi.error(e instanceof Error ? e.message : '导出失败')
    } finally {
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
    } catch (e) {
      messageApi.error(e instanceof Error ? e.message : '导出失败')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* 搜索区域卡片 */}
      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-50/80 to-white px-5 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500">
          <MagnifyingGlassIcon className="h-4 w-4" />
          <span>筛选条件</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <AttendanceStatsSearch
            onSearch={setSearchParams}
            onReset={() => setSearchParams({})}
            initialValues={searchParams}
          />
          {/* 导出操作区域 */}
          <div className="ml-auto flex items-center gap-3">
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
              icon={
                <ArrowDownTrayIconSolid className="size-4 text-amber-500/80!" />
              }
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
              icon={
                <ArrowDownTrayIconSolid className="size-4 text-emerald-500/80!" />
              }
              loading={exporting}
              onClick={handleExport}
              onMouseEnter={preloadAttendanceMonthlyExcel}
              onFocus={preloadAttendanceMonthlyExcel}
              disabled={viewerDenied}
            >
              导出出勤月报
            </Button>
          </div>
        </div>
      </div>

      {/* 统计概览 */}
      <div className="flex items-center gap-4 text-sm text-slate-500">
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
      {contextHolder}
    </div>
  )
}
