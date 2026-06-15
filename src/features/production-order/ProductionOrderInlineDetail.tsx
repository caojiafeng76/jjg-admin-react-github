import { Card, Statistic, Row, Col } from 'antd'
import dayjs from 'dayjs'
import {
  UserIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

import type { ProductionOrderListItem } from '@/services/apiProductionOrders'

interface Props {
  selectedRecord: ProductionOrderListItem | null
}

export default function ProductionOrderInlineDetail({ selectedRecord }: Props) {
  if (!selectedRecord) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6">
        <div className="rounded-full bg-slate-100 p-4">
          <svg
            className="h-8 w-8 text-slate-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
            />
          </svg>
        </div>
        <p className="text-sm text-slate-400">点击表格行查看工单详情</p>
      </div>
    )
  }

  const {
    order_date,
    is_audited,
    audited_at,
    work_hours,
    shift,
    positive_qualified_hours,
    extra_qualified_hours,
    total_qualified_hours,
    efficiency,
    remark,
    employee,
  } = selectedRecord

  const formattedAuditedAt = audited_at
    ? dayjs(audited_at).format('YYYY-MM-DD HH:mm')
    : null

  const efficiencyPercent =
    efficiency !== null && efficiency !== undefined
      ? (efficiency * 100).toFixed(1)
      : null

  const efficiencyColor =
    efficiencyPercent
      ? Number(efficiencyPercent) >= 100
        ? '#10b981'
        : Number(efficiencyPercent) >= 90
          ? '#475569'
          : '#ef4444'
      : '#475569'

  return (
    <div className="h-full overflow-auto p-4">
      {/* 头部信息卡片 */}
      <div className="mb-4 rounded-xl border border-slate-200/60 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm transition-all duration-200">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <CalendarDaysIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-800">
                {order_date}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    shift === '白班'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-indigo-50 text-indigo-600'
                  }`}
                >
                  {shift}
                </span>
                <span className="flex items-center gap-1">
                  <UserIcon className="h-3 w-3" />
                  {employee?.name || '未知'}
                </span>
              </div>
            </div>
          </div>
          <span
            className={`rounded-full px-3 py-0.5 text-xs font-medium ${
              is_audited
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            <span className="flex items-center gap-1">
              {is_audited && <CheckCircleIcon className="h-3 w-3" />}
              {is_audited ? '已审核' : '待审核'}
            </span>
          </span>
        </div>

        {is_audited && formattedAuditedAt && (
          <div className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-400">
            审核时间：{formattedAuditedAt}
          </div>
        )}
      </div>

      {/* 统计数据卡片 */}
      <Row gutter={[12, 12]} className="mb-4">
        <Col span={12}>
          <Card
            size="small"
            className="rounded-xl border-slate-200/60 shadow-sm transition-shadow hover:shadow-md"
          >
            <Statistic
              title={<span className="text-xs text-slate-400">出勤工时</span>}
              value={work_hours ?? 0}
              suffix="h"
              precision={1}
              valueStyle={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#475569',
              }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card
            size="small"
            className="rounded-xl border-slate-200/60 shadow-sm transition-shadow hover:shadow-md"
          >
            <Statistic
              title={<span className="text-xs text-slate-400">工时效率</span>}
              value={efficiencyPercent ?? 0}
              suffix="%"
              precision={1}
              valueStyle={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: efficiencyColor,
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* 工时明细 */}
      <Card
        size="small"
        title={
          <span className="flex items-center gap-2 text-sm font-medium">
            <ClockIcon className="h-4 w-4 text-slate-400" />
            工时明细
          </span>
        }
        className="mb-4 rounded-xl border-slate-200/60 shadow-sm"
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-emerald-50/50 p-3 transition-colors hover:bg-emerald-50">
            <div className="text-xs font-medium text-emerald-600">正工工时</div>
            <div className="mt-1 font-mono text-lg font-semibold text-emerald-700">
              {(positive_qualified_hours ?? 0).toFixed(2)}
              <span className="ml-1 text-xs font-normal text-emerald-500">h</span>
            </div>
          </div>
          <div className="rounded-lg bg-blue-50/50 p-3 transition-colors hover:bg-blue-50">
            <div className="text-xs font-medium text-blue-600">零工工时</div>
            <div className="mt-1 font-mono text-lg font-semibold text-blue-700">
              {(extra_qualified_hours ?? 0).toFixed(2)}
              <span className="ml-1 text-xs font-normal text-blue-500">h</span>
            </div>
          </div>
          <div className="col-span-2 rounded-lg bg-slate-50 p-3 transition-colors hover:bg-slate-100">
            <div className="text-xs font-medium text-slate-500">总工时</div>
            <div className="mt-1 font-mono text-xl font-bold text-slate-700">
              {(total_qualified_hours ?? 0).toFixed(2)}
              <span className="ml-1 text-sm font-normal text-slate-400">h</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 备注 */}
      {remark && (
        <Card
          size="small"
          title={
            <span className="text-sm font-medium text-slate-500">备注</span>
          }
          className="rounded-xl border-slate-200/60 shadow-sm"
        >
          <p className="text-sm text-slate-600">{remark}</p>
        </Card>
      )}
    </div>
  )
}
