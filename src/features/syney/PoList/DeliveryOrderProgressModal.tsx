import type {
  DeliveryOrderBatchSnapshot,
  DeliveryOrderProgress,
} from './deliveryOrderBatch'
import type { StatusTone } from '@/ui/StatusPill'
import { Alert, Button, Modal, Progress, Steps } from 'antd'

import StatusPill from '@/ui/StatusPill'
import { DELIVERY_ORDER_STEPS } from './deliveryOrderBatch'

export interface DeliveryOrderProgressModalProps {
  open: boolean
  running: boolean
  stopping: boolean
  snapshot: DeliveryOrderBatchSnapshot | null
  hasFile: boolean
  onStop: () => void
  onRedownload: () => void
  onClose: () => void
}

const ORDER_STATUS: Record<DeliveryOrderProgress['status'], { label: string, tone: StatusTone }> = {
  pending: { label: '等待中', tone: 'neutral' },
  running: { label: '处理中', tone: 'info' },
  success: { label: '已完成', tone: 'success' },
  error: { label: '失败', tone: 'danger' },
  stopped: { label: '已停止', tone: 'warning' },
}

function isOrderDone(order: DeliveryOrderProgress) {
  return order.status !== 'pending' && order.status !== 'running'
}

function stepDescription(order: DeliveryOrderProgress, key: string) {
  if (key === 'safeParts' && order.safePartSkipped)
    return '无需填写'
  if (key === 'safeParts' && order.safePartTotal > 0)
    return `${order.safePartDone}/${order.safePartTotal}`
  if (key === 'create' && order.deliveryNo)
    return order.deliveryNo
  return undefined
}

function OrderRow({ order }: { order: DeliveryOrderProgress }) {
  const status = ORDER_STATUS[order.status]

  return (
    <div className="flex flex-col gap-2 rounded-md border border-slate-200 px-3 py-2 dark:border-slate-700">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-slate-700 dark:text-slate-200">{order.poNo}</span>
        {order.deliveryNo
          ? (
              <span className="text-xs text-slate-500 tabular-nums dark:text-slate-400">
                {`送货单 ${order.deliveryNo}`}
              </span>
            )
          : null}
        <span className="ml-auto">
          <StatusPill tone={status.tone}>{status.label}</StatusPill>
        </span>
      </div>
      <Steps
        size="small"
        items={DELIVERY_ORDER_STEPS.map(step => ({
          title: step.title,
          status: order.steps[step.key],
          description: stepDescription(order, step.key),
        }))}
      />
      {order.message
        ? (
            <div
              className={
                order.status === 'error'
                  ? 'text-sm text-rose-600 dark:text-rose-400'
                  : 'text-sm text-amber-600 dark:text-amber-400'
              }
            >
              {order.message}
            </div>
          )
        : null}
      {order.warnings.map(warning => (
        <div key={warning} className="text-xs text-amber-600 dark:text-amber-400">
          {warning}
        </div>
      ))}
    </div>
  )
}

function PrintStatus({ snapshot }: { snapshot: DeliveryOrderBatchSnapshot }) {
  const { print } = snapshot

  if (print.status === 'wait')
    return null
  if (print.status === 'process')
    return <Alert type="info" showIcon title="正在导出并下载送货单…" />
  if (print.status === 'finish')
    return <Alert type="success" showIcon title={`送货单已下载：${print.fileName}`} />
  if (print.status === 'skipped')
    return <Alert type="warning" showIcon title={print.message} />
  return <Alert type="error" showIcon title={print.message} />
}

export default function DeliveryOrderProgressModal({
  open,
  running,
  stopping,
  snapshot,
  hasFile,
  onStop,
  onRedownload,
  onClose,
}: DeliveryOrderProgressModalProps) {
  const orders = snapshot?.orders ?? []
  const doneCount = orders.filter(isOrderDone).length
  const successCount = orders.filter(order => order.status === 'success').length
  const percent = orders.length ? Math.round((doneCount / orders.length) * 100) : 0
  const current = orders.find(order => order.status === 'running')
  const currentStepTitle = DELIVERY_ORDER_STEPS.find(step => step.key === current?.currentStep)?.title

  const footer = running
    ? [
        <Button key="stop" danger loading={stopping} onClick={onStop}>
          {stopping ? '当前步骤完成后停止' : '停止'}
        </Button>,
      ]
    : [
        hasFile
          ? (
              <Button key="redownload" onClick={onRedownload}>
                重新下载
              </Button>
            )
          : null,
        <Button key="close" type="primary" onClick={onClose}>
          关闭
        </Button>,
      ]

  return (
    <Modal
      title="生成送货单"
      open={open}
      width={760}
      closable={!running}
      mask={{ closable: false }}
      keyboard={!running}
      footer={footer}
      onCancel={onClose}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
            <span>
              {running
                ? current
                  ? `正在处理 ${current.poNo}：${currentStepTitle ?? '准备中'}`
                  : snapshot?.print.status === 'process'
                    ? '正在导出送货单'
                    : '正在读取本系统安全部件信息'
                : `已完成 ${successCount}/${orders.length} 张`}
            </span>
            <span className="tabular-nums">{`${doneCount}/${orders.length}`}</span>
          </div>
          <Progress
            percent={percent}
            status={running ? 'active' : successCount === orders.length ? 'success' : 'normal'}
            showInfo={false}
          />
        </div>

        <div className="flex max-h-[55vh] flex-col gap-2 overflow-y-auto">
          {orders.map(order => (
            <OrderRow key={order.poNo} order={order} />
          ))}
        </div>

        {snapshot ? <PrintStatus snapshot={snapshot} /> : null}
      </div>
    </Modal>
  )
}
