import type { ProjectNoData } from './mobileProductionOrderScanTypes'
import type { ScannedProjectPayload } from './ProjectNoScanButton'

import { Typography } from 'antd'
import dayjs from 'dayjs'
import ProjectNoScanButton from './ProjectNoScanButton'

const { Text, Title } = Typography

export interface MobileProductionOrderScanHeaderProps {
  isEditMode: boolean
  isExistingOrderMode: boolean
  projectNos: ProjectNoData[] | undefined
  employeeName: string
  handleProjectNoScanResolved: (payload: ScannedProjectPayload) => void
}

export default function MobileProductionOrderScanHeader({
  isEditMode,
  isExistingOrderMode,
  projectNos,
  employeeName,
  handleProjectNoScanResolved,
}: MobileProductionOrderScanHeaderProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold tracking-[0.2em] text-slate-400 uppercase dark:text-slate-500">
            Scan To Add
          </div>
          <Title level={4} className="mt-1.5! mb-1! text-slate-900! dark:text-slate-100!">
            {isEditMode
              ? '编辑工序明细'
              : isExistingOrderMode
                ? '新增工序明细'
                : '扫码添加工单'}
          </Title>
          <Text type="secondary">
            {isEditMode
              ? '在独立页面中修改工序明细，提交后返回原工单。'
              : isExistingOrderMode
                ? '为当前工单新增工序明细，提交后返回详情页。'
                : '扫描项目号后直接录入工序明细；若当天已有工单，则自动追加到当天工单，否则创建新工单。'}
          </Text>
        </div>

        <ProjectNoScanButton
          projectNos={projectNos}
          onResolved={handleProjectNoScanResolved}
        />
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
        <div className="flex items-center justify-between gap-3">
          <span>当前录入日期</span>
          <span className="font-semibold text-slate-900 tabular-nums dark:text-slate-100">
            {dayjs().format('YYYY-MM-DD')}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <span>录入员工</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {employeeName}
          </span>
        </div>
      </div>
    </section>
  )
}
