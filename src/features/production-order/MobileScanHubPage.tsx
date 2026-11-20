import type { ScannedProjectPayload } from './ProjectNoScanButton'
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  CubeIcon,
  ViewfinderCircleIcon,
} from '@heroicons/react/24/outline'
import { Button, Typography } from 'antd'

import { useNavigate } from 'react-router-dom'
import { isEmployeeSideRole } from '@/config/access'
import { useAuth } from '@/contexts/useAuth'
import {
  SYNEY_MATERIALS_INVENTORY_PERMISSION_KEY,
  SYNEY_MATERIALS_STOCK_IN_PERMISSION_KEY,
  SYNEY_MATERIALS_STOCK_OUT_PERMISSION_KEY,
} from '@/features/syney-materials/permissions'
import { usePermission } from '@/hooks/usePermission'
import ProjectNoScanButton from './ProjectNoScanButton'
import { useSalesOrdersProjectNos } from './useProcessStandards'

const { Paragraph, Title } = Typography

export default function MobileScanHubPage() {
  const navigate = useNavigate()
  const { role, employeeProfile } = useAuth()
  const { data: projectNos } = useSalesOrdersProjectNos()
  const isEmployeeView = isEmployeeSideRole(role)
  const canSyneyStockIn = usePermission(SYNEY_MATERIALS_STOCK_IN_PERMISSION_KEY)
  const canSyneyStockOut = usePermission(SYNEY_MATERIALS_STOCK_OUT_PERMISSION_KEY)
  const canSyneyInventory = usePermission(SYNEY_MATERIALS_INVENTORY_PERMISSION_KEY)
  const syneyMaterialsEntries = [
    canSyneyStockIn && { path: '/syney-materials-stock-in', label: '材料入库', icon: ArrowDownTrayIcon },
    canSyneyStockOut && { path: '/syney-materials-stock-out', label: '材料出库', icon: ArrowUpTrayIcon },
    canSyneyInventory && { path: '/syney-materials-inventory', label: '查库存', icon: CubeIcon },
  ].filter(entry => entry !== false)

  const openAutoScanPage = (pathname: string) => {
    navigate(pathname, {
      state: { autoOpenScanner: true },
    })
  }

  function handleProjectResolved(payload: ScannedProjectPayload) {
    navigate('/production-order/scan', {
      state: { scannedProject: payload },
    })
  }

  if (!isEmployeeView || !employeeProfile?.id) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
          <Title level={4} className="text-slate-900! dark:text-slate-100!">
            当前账号不可使用扫码功能
          </Title>
          <Paragraph className="text-slate-500! dark:text-slate-400!">
            请使用员工端账号进入后，再通过扫码入口处理工单。
          </Paragraph>
          <Button type="primary" onClick={() => navigate('/production-order')}>
            返回我的工单
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto px-4 pt-4 pb-8">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <section className="rounded-2xl border border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-[11px] font-semibold tracking-[0.2em] text-slate-400 uppercase dark:text-slate-500">
            Scan Hub
          </div>
          <Title level={4} className="mt-2! mb-1.5! text-slate-900! dark:text-slate-100!">
            扫码导航
          </Title>
          <Paragraph className="mb-0! text-sm text-slate-500 dark:text-slate-400">
            先选择扫码入口，再进入对应录入页。后续可以继续在这里扩展更多扫码按钮。
          </Paragraph>
        </section>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <ProjectNoScanButton
            projectNos={projectNos}
            onResolved={handleProjectResolved}
            renderTrigger={({ disabled, openScanner }) => (
              <button
                type="button"
                onClick={openScanner}
                disabled={disabled}
                className="flex min-h-40 w-full flex-col items-center justify-center rounded-2xl border border-primary/40 bg-primary/5 px-4 py-5 text-slate-900 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 dark:border-primary/50 dark:bg-primary/10 dark:text-slate-100"
              >
                <ViewfinderCircleIcon className="size-12 text-primary" />
                <span className="mt-4 text-base font-semibold tracking-tight">
                  工单扫描
                </span>
                <span className="mt-1.5 text-center text-xs text-slate-500 dark:text-slate-400">
                  扫码后跳转工序录入页
                </span>
              </button>
            )}
          />

          <button
            type="button"
            onClick={() => openAutoScanPage('/material-transfer/scan')}
            className="flex min-h-40 w-full flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-5 text-slate-900 transition active:scale-[0.99] dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
          >
            <ViewfinderCircleIcon className="size-12 text-slate-600 dark:text-slate-300" />
            <span className="mt-4 text-base font-semibold tracking-tight">
              物料转移
            </span>
            <span className="mt-1.5 text-center text-xs text-slate-500 dark:text-slate-400">
              点击后直接启动扫码并进入录入页
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              openAutoScanPage('/precision-finishing-cutting/scan')}
            className="flex min-h-40 w-full flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-5 text-slate-900 transition active:scale-[0.99] dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
          >
            <ViewfinderCircleIcon className="size-12 text-slate-600 dark:text-slate-300" />
            <span className="mt-4 text-base font-semibold tracking-tight">
              精加工切割
            </span>
            <span className="mt-1.5 text-center text-xs text-slate-500 dark:text-slate-400">
              点击后直接启动扫码并进入录入页
            </span>
          </button>
        </div>

        {syneyMaterialsEntries.length > 0
          ? (
              <section aria-label="西尼材料">
                <div className="mt-1 mb-2.5 px-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  西尼材料
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {syneyMaterialsEntries.map(entry => (
                    <button
                      key={entry.path}
                      type="button"
                      onClick={() => navigate(entry.path)}
                      className="flex min-h-24 w-full flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-2 py-3.5 text-slate-900 transition active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
                    >
                      <entry.icon className="size-8 text-slate-600 dark:text-slate-300" />
                      <span className="mt-2.5 text-sm font-semibold tracking-tight">
                        {entry.label}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )
          : null}
      </div>
    </div>
  )
}
