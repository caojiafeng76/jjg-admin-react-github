import { Tag } from 'antd'

import type { useOperationsByModel } from './useProcessStandards'
import {
  formatDisplayValue,
  type ActiveSheet,
  type ProjectNoData,
} from './mobileProductionOrderScanTypes'

export interface MobileProductionOrderScanBasicInfoProps {
  projectNo: string
  operation: string
  currentProject: ProjectNoData | undefined
  currentProductModel: string
  operationMatch: ReturnType<typeof useOperationsByModel>['data']
  currentMachineLabel: string
  setActiveSheet: (sheet: ActiveSheet) => void
}

export default function MobileProductionOrderScanBasicInfo({
  projectNo,
  operation,
  currentProject,
  currentProductModel,
  operationMatch,
  currentMachineLabel,
  setActiveSheet,
}: MobileProductionOrderScanBasicInfoProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase dark:text-slate-500">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
        基本信息
      </div>

      <div>
        <div className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
          项目号
        </div>
        <div className="mb-2 text-xs text-slate-500 dark:text-slate-400">
          可扫码自动带出，也可手动修改
        </div>
        <button
          type="button"
          onClick={() => setActiveSheet('project')}
          className="flex h-12 w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 text-left shadow-sm dark:border-slate-700/80 dark:bg-slate-900/90"
        >
          <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {projectNo || '请选择项目号'}
          </div>
          <span className="text-sm font-medium text-slate-400 dark:text-slate-500">
            选择
          </span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
          <div className="text-[11px] font-medium tracking-[0.12em] text-slate-400 uppercase dark:text-slate-500">
            型号
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {formatDisplayValue(currentProject?.product_model)}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
          <div className="text-[11px] font-medium tracking-[0.12em] text-slate-400 uppercase dark:text-slate-500">
            长度(mm)
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {formatDisplayValue(currentProject?.length_mm)}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
          <div className="text-[11px] font-medium tracking-[0.12em] text-slate-400 uppercase dark:text-slate-500">
            客户型号
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {formatDisplayValue(currentProject?.customer_model)}
          </div>
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
          <span>工序</span>
          {operationMatch?.matchLevel ? (
            <Tag
              color={
                operationMatch.matchLevel === 'type-a'
                  ? 'success'
                  : 'processing'
              }
            >
              {operationMatch.matchLevel === 'type-a' ? 'A类匹配' : 'B类匹配'}
            </Tag>
          ) : null}
        </div>
        <div className="mb-2 text-xs text-slate-500 dark:text-slate-400">
          {currentProductModel
            ? '根据项目号自动匹配工序列表'
            : '请先确定项目号'}
        </div>
        <button
          type="button"
          onClick={() => setActiveSheet('operation')}
          className="flex h-12 w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 text-left shadow-sm disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700/80 dark:bg-slate-900/90"
          disabled={!currentProductModel}
        >
          <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {operation || '请选择工序'}
          </div>
          <span className="text-sm font-medium text-slate-400 dark:text-slate-500">
            选择
          </span>
        </button>
      </div>

      <div>
        <div className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
          机器编号
        </div>
        <div className="mb-2 text-xs text-slate-500 dark:text-slate-400">
          {operation ? '从底部弹层中选择机器编号' : '请先选择工序'}
        </div>
        <button
          type="button"
          onClick={() => setActiveSheet('machine')}
          className="flex h-12 w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 text-left shadow-sm disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700/80 dark:bg-slate-900/90"
          disabled={!operation}
        >
          <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {currentMachineLabel}
          </div>
          <span className="text-sm font-medium text-slate-400 dark:text-slate-500">
            选择
          </span>
        </button>
      </div>
    </div>
  )
}
