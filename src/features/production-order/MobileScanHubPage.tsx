import { Button, Card, Typography } from 'antd'
import { BiScan } from 'react-icons/bi'
import { useNavigate } from 'react-router-dom'

import { isEmployeeSideRole } from '@/config/access'
import { useAuth } from '@/contexts/useAuth'
import ProjectNoScanButton, {
  type ScannedProjectPayload,
} from './ProjectNoScanButton'
import { useSalesOrdersProjectNos } from './useProcessStandards'

const { Paragraph, Title } = Typography

export default function MobileScanHubPage() {
  const navigate = useNavigate()
  const { role, employeeProfile } = useAuth()
  const { data: projectNos } = useSalesOrdersProjectNos()
  const isEmployeeView = isEmployeeSideRole(role)

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
        <Card className="w-full max-w-md rounded-3xl text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <Title level={4}>当前账号不可使用扫码功能</Title>
          <Paragraph type="secondary">
            请使用员工端账号进入后，再通过扫码入口处理工单。
          </Paragraph>
          <Button type="primary" onClick={() => navigate('/production-order')}>
            返回我的工单
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto px-4 pt-4 pb-8">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
          <div className="text-[11px] font-semibold tracking-[0.28em] text-slate-400 uppercase">
            Scan Hub
          </div>
          <Title level={3} style={{ marginTop: 12, marginBottom: 8 }}>
            扫码导航
          </Title>
          <Paragraph className="mb-0 text-slate-500">
            先选择扫码入口，再进入对应录入页。后续可以继续在这里扩展更多扫码按钮。
          </Paragraph>
        </section>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <ProjectNoScanButton
            projectNos={projectNos}
            onResolved={handleProjectResolved}
            renderTrigger={({ disabled, openScanner }) => (
              <button
                type="button"
                onClick={openScanner}
                disabled={disabled}
                className="flex min-h-44 w-full flex-col items-center justify-center rounded-4xl border-[3px] border-slate-950 bg-white px-4 py-6 text-slate-950 shadow-[0_18px_40px_rgba(15,23,42,0.08)] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <BiScan className="size-16" />
                <span className="mt-5 text-lg font-semibold tracking-tight">
                  工单扫描
                </span>
                <span className="mt-2 text-center text-xs text-slate-500">
                  扫码后跳转工序录入页
                </span>
              </button>
            )}
          />

          <button
            type="button"
            onClick={() => openAutoScanPage('/material-transfer/scan')}
            className="flex min-h-44 w-full flex-col items-center justify-center rounded-4xl border-[3px] border-slate-200 bg-white px-4 py-6 text-slate-950 shadow-[0_18px_40px_rgba(15,23,42,0.08)] transition active:scale-[0.99]"
          >
            <BiScan className="size-16" />
            <span className="mt-5 text-lg font-semibold tracking-tight">
              物料转移
            </span>
            <span className="mt-2 text-center text-xs text-slate-500">
              点击后直接启动扫码并进入录入页
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              openAutoScanPage('/precision-finishing-cutting/scan')
            }
            className="flex min-h-44 w-full flex-col items-center justify-center rounded-4xl border-[3px] border-slate-200 bg-white px-4 py-6 text-slate-950 shadow-[0_18px_40px_rgba(15,23,42,0.08)] transition active:scale-[0.99]"
          >
            <BiScan className="size-16" />
            <span className="mt-5 text-lg font-semibold tracking-tight">
              精加工切割
            </span>
            <span className="mt-2 text-center text-xs text-slate-500">
              点击后直接启动扫码并进入录入页
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
