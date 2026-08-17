import { Empty } from 'antd'
import type { StandardTime } from '@/services/apiStandardTimes'
import { calculateDailyStandardCapacity } from '@/utils/costAccounting'
import { formatNumber } from '@/utils/format'

interface Props {
  selectedRecord: StandardTime | null
}

export default function StandardTimeCostDetail({ selectedRecord }: Props) {
  if (!selectedRecord) {
    return (
      <div className="flex h-full items-center justify-center">
        <Empty
          description={
            <span className="text-slate-400 dark:text-slate-500">
              点击上方表格行查看成本详情
            </span>
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    )
  }

  const {
    record_type,
    is_last_process,
    model,
    operation,
    standard_seconds,
    theoretical_seconds,
    inspection_seconds,
    labor_rate,
    labor_cost_coefficient,
    equipment_rate,
    tool_rate,
    cutting_fluid_rate,
    fixture_rate,
    daily_management_cost,
    daily_total_hours,
    labor_cost,
    equipment_cost,
    tooling_consumable_cost,
    inspection_cost,
    overhead_cost,
    total_cost,
    uploaded_by_name,
    remark,
    created_at,
    updated_at,
  } = selectedRecord

  const operationStr = Array.isArray(operation)
    ? operation.join(', ')
    : operation

  const dailyCapacity = calculateDailyStandardCapacity(standard_seconds)

  return (
    <div className="h-full overflow-auto p-4">
      {/* Header Card */}
      <div className="mb-4 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 p-4 dark:border-slate-700 dark:from-slate-800 dark:to-slate-800">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm ${
              record_type === 'A'
                ? 'bg-slate-800 text-white dark:bg-slate-600'
                : 'border border-slate-200 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300'
            }`}
          >
            {record_type === 'A' ? 'A类' : 'B类'}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm ${
              is_last_process
                ? 'bg-slate-800 text-white dark:bg-slate-600'
                : 'border border-slate-200 bg-white text-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400'
            }`}
          >
            {is_last_process ? '末道' : '非末道'}
          </span>
        </div>

        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {model}
          </span>
          <span className="text-slate-400 dark:text-slate-500">·</span>
          <span className="text-slate-600 dark:text-slate-300">
            {operationStr}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 dark:text-slate-500">标准工时:</span>
            <span className="font-medium text-indigo-600 dark:text-indigo-400">
              {standard_seconds}s
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 dark:text-slate-500">日产能:</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              {formatNumber(dailyCapacity, 2)} 件
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 dark:text-slate-500">理论工时:</span>
            <span className="font-medium text-cyan-600 dark:text-cyan-400">
              {theoretical_seconds}s
            </span>
          </div>
        </div>
      </div>

      {/* Cost Grid */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {/* Labor Cost */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
            人工成本
          </div>
          <div className="text-lg font-bold text-slate-800 tabular-nums dark:text-slate-100">
            {formatNumber(labor_cost)}
          </div>
          <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            费率 {formatNumber(labor_rate)} × 系数 {formatNumber(labor_cost_coefficient)}
          </div>
        </div>

        {/* Equipment Cost */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
            设备成本
          </div>
          <div className="text-lg font-bold text-slate-800 tabular-nums dark:text-slate-100">
            {formatNumber(equipment_cost)}
          </div>
          <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            费率 {formatNumber(equipment_rate)}
          </div>
        </div>

        {/* Tooling Cost */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
            刀具辅料
          </div>
          <div className="text-lg font-bold text-slate-800 tabular-nums dark:text-slate-100">
            {formatNumber(tooling_consumable_cost)}
          </div>
          <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            刀具 {formatNumber(tool_rate)} + 切削液 {formatNumber(cutting_fluid_rate)} + 工装 {formatNumber(fixture_rate)}
          </div>
        </div>

        {/* Inspection Cost */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
            检验成本
          </div>
          <div className="text-lg font-bold text-slate-800 tabular-nums dark:text-slate-100">
            {formatNumber(inspection_cost)}
          </div>
          <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            检验工时 {inspection_seconds}s
          </div>
        </div>
      </div>

      {/* Total and Overhead */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        {/* Overhead Cost */}
        <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-3 dark:border-amber-500/30 dark:from-amber-500/10 dark:to-orange-500/10">
          <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400">
            单品分摊额
          </div>
          <div className="text-lg font-bold text-amber-700 tabular-nums dark:text-amber-300">
            {formatNumber(overhead_cost)}
          </div>
        </div>

        {/* Total Cost - Highlighted */}
        <div className="rounded-xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-3 shadow-md dark:border-indigo-500/40 dark:from-indigo-500/10 dark:to-purple-500/10">
          <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            合计成本
          </div>
          <div className="text-2xl font-bold text-indigo-700 tabular-nums dark:text-indigo-300">
            {formatNumber(total_cost)}
          </div>
        </div>
      </div>

      {/* Management Info */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
            日管理总费用
          </div>
          <div className="text-lg font-semibold text-slate-700 tabular-nums dark:text-slate-200">
            {formatNumber(daily_management_cost, 2)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
            日总工时
          </div>
          <div className="text-lg font-semibold text-slate-700 tabular-nums dark:text-slate-200">
            {formatNumber(daily_total_hours, 2)} h
          </div>
        </div>
      </div>

      {/* Meta Info */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-2 flex items-center gap-4 text-sm">
          <div>
            <span className="text-slate-400 dark:text-slate-500">数据上传：</span>
            <span className="font-medium text-slate-600 dark:text-slate-300">
              {uploaded_by_name || '-'}
            </span>
          </div>
        </div>
        {remark && (
          <div className="mb-2 text-sm">
            <span className="text-slate-400 dark:text-slate-500">备注：</span>
            <span className="text-slate-600 dark:text-slate-300">{remark}</span>
          </div>
        )}
        <div className="flex flex-wrap gap-4 text-xs text-slate-400 dark:text-slate-500">
          <span>创建: {created_at ? new Date(created_at).toLocaleString('zh-CN') : '-'}</span>
          <span>更新: {updated_at ? new Date(updated_at).toLocaleString('zh-CN') : '-'}</span>
        </div>
      </div>
    </div>
  )
}
