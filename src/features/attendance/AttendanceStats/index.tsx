import { useMemo, useState } from 'react'
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
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'

import { useTableHeight } from '@/hooks/useTableHeight'
import type { AttendanceLateEarlyStat } from '@/services/apiAttendanceDetails'
import {
  getAttendanceMonthlyExportData,
  getAttendanceLateEarlyStats,
} from '@/services/apiAttendanceDetails'
import {
  exportAttendanceMonthlyExcel,
  exportAttendanceLateEarlyExcel,
} from '@/utils/attendanceMonthlyExcel'

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

function DatesPopover({
  count,
  dates,
  color,
}: {
  count: number
  dates: string[]
  color: string
}) {
  if (count === 0) return <span className="text-gray-400">0</span>
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

function ShiftStatsTab({ searchParams }: { searchParams: SearchParams }) {
  const { data, isLoading } = useAttendanceShiftStats(searchParams)
  const { tableContainerRef, scrollY } = useTableHeight({ targetRowCount: 14 })

  return (
    <div ref={tableContainerRef} className="min-h-0 overflow-x-auto">
      <Table
        size="small"
        loading={isLoading}
        dataSource={data || []}
        rowKey="name"
        pagination={false}
        scroll={{ x: 'max-content', y: scrollY }}
        columns={[
          {
            title: '#',
            key: '#',
            width: 60,
            fixed: 'left',
            render: (_v, _r, i) => i + 1,
          },
          {
            title: '姓名',
            dataIndex: 'name',
            key: 'name',
            width: 140,
            fixed: 'left',
          },
          {
            title: '出勤天数',
            dataIndex: 'total_days',
            key: 'total_days',
            width: 110,
            align: 'center',
          },
          {
            title: '白班天数',
            dataIndex: 'day_shift_days',
            key: 'day_shift_days',
            width: 110,
            align: 'center',
            render: (v: number) => <Tag color="blue">{v}</Tag>,
          },
          {
            title: '夜班天数',
            dataIndex: 'night_shift_days',
            key: 'night_shift_days',
            width: 110,
            align: 'center',
            render: (v: number) => <Tag color="purple">{v}</Tag>,
          },
        ]}
      />
    </div>
  )
}

function LateEarlyTab({ searchParams }: { searchParams: SearchParams }) {
  const { data, isLoading } = useAttendanceLateEarlyStats(searchParams)
  const { tableContainerRef, scrollY } = useTableHeight({ targetRowCount: 14 })

  const columns: TableColumnsType<AttendanceLateEarlyStat> = useMemo(
    () => [
      {
        title: '#',
        key: '#',
        width: 60,
        fixed: 'left',
        render: (_v, _r, i) => i + 1,
      },
      {
        title: '姓名',
        dataIndex: 'name',
        key: 'name',
        width: 140,
        fixed: 'left',
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
    ],
    [],
  )

  return (
    <div ref={tableContainerRef} className="min-h-0 overflow-x-auto">
      <Table
        size="small"
        loading={isLoading}
        dataSource={data || []}
        rowKey="name"
        pagination={false}
        scroll={{ x: 'max-content', y: scrollY }}
        columns={columns}
      />
    </div>
  )
}

export default function AttendanceStatsPage() {
  const [searchParams, setSearchParams] = useState<SearchParams>({})
  const [exportMonth, setExportMonth] = useState<Dayjs | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportingLateEarly, setExportingLateEarly] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  async function handleExportLateEarly() {
    setExportingLateEarly(true)
    try {
      const rows = await getAttendanceLateEarlyStats(searchParams)
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
    if (!exportMonth) {
      messageApi.warning('请先选择导出月份')
      return
    }
    const year = exportMonth.year()
    const month = exportMonth.month() + 1
    setExporting(true)
    try {
      const rows = await getAttendanceMonthlyExportData({
        year,
        month,
        name: searchParams.name,
      })
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
    <div className="grid h-full grid-rows-[auto_1fr] gap-4">
      {contextHolder}
      <div className="flex flex-wrap items-center gap-2">
        <span className="whitespace-nowrap text-gray-600">筛选：</span>
        <AttendanceStatsSearch
          onSearch={setSearchParams}
          onReset={() => setSearchParams({})}
          initialValues={searchParams}
        />
        <div className="ml-auto flex items-center gap-2">
          <DatePicker
            picker="month"
            value={exportMonth}
            onChange={setExportMonth}
            placeholder="选择导出月份"
            allowClear
          />
          <Button
            icon={<ArrowDownTrayIcon className="h-4 w-4" />}
            loading={exportingLateEarly}
            onClick={handleExportLateEarly}
          >
            导出迟到/早退
          </Button>
          <Button
            type="primary"
            icon={<ArrowDownTrayIcon className="h-4 w-4" />}
            loading={exporting}
            onClick={handleExport}
          >
            导出出勤月报
          </Button>
        </div>
      </div>

      <Tabs
        className="min-h-0"
        items={[
          {
            key: 'shift',
            label: '班次统计',
            children: <ShiftStatsTab searchParams={searchParams} />,
          },
          {
            key: 'late-early',
            label: '迟到/早退',
            children: <LateEarlyTab searchParams={searchParams} />,
          },
        ]}
      />
    </div>
  )
}
