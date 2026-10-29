import type {
  SyneyDeliveryOrderResponseMap,
  SyneySafePartDetailPlanItem,
  SyneySafePartSourceRow,
} from '@/services/syneyDeliveryOrderContract'

import { getUserErrorMessage } from '@/utils/errorHandler'

/** 单张订单号依次经过的步骤 */
export const DELIVERY_ORDER_STEPS = [
  { key: 'create', title: '生成送货单' },
  { key: 'safeParts', title: '填写安全部件' },
  { key: 'confirm', title: '供应商确认' },
  { key: 'writeBack', title: '回写本系统' },
] as const

export type DeliveryOrderStepKey = (typeof DELIVERY_ORDER_STEPS)[number]['key']
export type DeliveryOrderStepStatus = 'wait' | 'process' | 'finish' | 'error'

export interface DeliveryOrderProgress {
  poNo: string
  status: 'pending' | 'running' | 'success' | 'error' | 'stopped'
  currentStep: DeliveryOrderStepKey | null
  steps: Record<DeliveryOrderStepKey, DeliveryOrderStepStatus>
  deliveryOrderId?: number
  deliveryNo?: string
  safePartDone: number
  safePartTotal: number
  /** SCM 明细 IsSafePart 全部为 false，跳过了填写安全部件 */
  safePartSkipped: boolean
  /** 失败原因或停止说明 */
  message?: string
  warnings: string[]
}

export interface DeliveryOrderPrintProgress {
  status: 'wait' | 'process' | 'finish' | 'error' | 'skipped'
  fileName?: string
  message?: string
}

export interface DeliveryOrderBatchSnapshot {
  orders: DeliveryOrderProgress[]
  print: DeliveryOrderPrintProgress
}

export interface DeliveryOrderBatchDeps {
  /** 一次性读取所有订单号的安全部件信息，key 为订单号 */
  loadSafePartSources: (poNos: string[]) => Promise<Map<string, SyneySafePartSourceRow[]>>
  createDeliveryOrder: (poNo: string) => Promise<SyneyDeliveryOrderResponseMap['create']>
  planSafeParts: (
    deliveryNo: string,
    parts: SyneySafePartSourceRow[],
  ) => Promise<SyneyDeliveryOrderResponseMap['planSafeParts']>
  addSafePartDetail: (
    item: SyneySafePartDetailPlanItem,
  ) => Promise<SyneyDeliveryOrderResponseMap['addSafePartDetail']>
  confirmDeliveryOrder: (
    deliveryOrderId: number,
    deliveryNo: string,
  ) => Promise<SyneyDeliveryOrderResponseMap['confirm']>
  markPosDelivered: (poNo: string, deliveryNo: string) => Promise<void>
  printDeliveryOrders: (
    deliveryOrderIds: number[],
    deliveryNos: string[],
  ) => Promise<{ fileName: string, blob: Blob }>
  downloadFile: (fileName: string, blob: Blob) => void
}

export interface RunDeliveryOrderBatchOptions {
  poNos: string[]
  deps: DeliveryOrderBatchDeps
  onUpdate: (snapshot: DeliveryOrderBatchSnapshot) => void
  /** 返回 true 时，当前步骤完成后不再继续 */
  shouldStop?: () => boolean
}

export interface DeliveryOrderBatchResult extends DeliveryOrderBatchSnapshot {
  file?: { fileName: string, blob: Blob }
}

class StopRequestedError extends Error {}

/**
 * 进度弹窗里的失败原因：优先用可直接展示的中文；只能拿到英文原文时（如 SCM 异常页）
 * 附在兜底文案后面，避免只看到「处理失败」而无从排查。
 */
export function describeError(error: unknown, fallback: string) {
  const message = getUserErrorMessage(error, fallback)
  const raw = error instanceof Error ? error.message.trim() : ''
  return message === fallback && raw ? `${fallback}（${raw.slice(0, 200)}）` : message
}

function createProgress(poNo: string): DeliveryOrderProgress {
  return {
    poNo,
    status: 'pending',
    currentStep: null,
    steps: { create: 'wait', safeParts: 'wait', confirm: 'wait', writeBack: 'wait' },
    safePartDone: 0,
    safePartTotal: 0,
    safePartSkipped: false,
    warnings: [],
  }
}

/** 订单号去重、去空，保持勾选顺序 */
export function uniquePoNos(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .map(value => (value ?? '').trim())
        .filter(value => value && value !== 'null'),
    ),
  )
}

/**
 * 逐张处理订单号：① 生成送货单 → ② 填写安全部件 → ③ 供应商确认 → 回写本系统。
 * 严格串行（SCM 是同步操作，不能并发）；某张失败记录原因后继续下一张；
 * 全部结束后对成功的送货单只调用一次导出，由 SCM 合并成一个文件。
 */
export async function runDeliveryOrderBatch({
  poNos,
  deps,
  onUpdate,
  shouldStop = () => false,
}: RunDeliveryOrderBatchOptions): Promise<DeliveryOrderBatchResult> {
  const orders = poNos.map(createProgress)
  const print: DeliveryOrderPrintProgress = { status: 'wait' }

  const emit = () => {
    onUpdate({
      orders: orders.map(order => ({
        ...order,
        steps: { ...order.steps },
        warnings: [...order.warnings],
      })),
      print: { ...print },
    })
  }

  const checkStop = () => {
    if (shouldStop())
      throw new StopRequestedError()
  }

  const startStep = (order: DeliveryOrderProgress, step: DeliveryOrderStepKey) => {
    checkStop()
    order.currentStep = step
    order.steps[step] = 'process'
    emit()
  }

  const finishStep = (order: DeliveryOrderProgress, step: DeliveryOrderStepKey) => {
    order.steps[step] = 'finish'
    emit()
  }

  emit()
  const sources = await deps.loadSafePartSources(poNos)

  for (const order of orders) {
    if (shouldStop()) {
      order.status = 'stopped'
      order.message = '已停止，未处理'
      emit()
      continue
    }

    order.status = 'running'
    try {
      startStep(order, 'create')
      const created = await deps.createDeliveryOrder(order.poNo)
      order.deliveryOrderId = created.deliveryOrderId
      order.deliveryNo = created.deliveryNo
      if (created.reused) {
        order.warnings.push(`SCM 中已有未确认的送货单 ${created.deliveryNo}，已沿用`)
      }
      finishStep(order, 'create')

      startStep(order, 'safeParts')
      const parts = sources.get(order.poNo) ?? []
      if (created.hasSafeParts === false) {
        order.safePartSkipped = true
        if (parts.length > 0) {
          order.warnings.push(
            `SCM 标记该订单明细均不是安全部件，已跳过填写（本系统按件号配置识别到 ${parts.length} 条，请核对件号配置）`,
          )
        }
      }
      else {
        const plan = await deps.planSafeParts(created.deliveryNo, parts)
        order.warnings.push(...plan.warnings)
        order.safePartTotal = plan.items.length + plan.skipped
        order.safePartDone = plan.skipped
        emit()
        for (const item of plan.items) {
          checkStop()
          await deps.addSafePartDetail(item)
          order.safePartDone++
          emit()
        }
      }
      finishStep(order, 'safeParts')

      startStep(order, 'confirm')
      await deps.confirmDeliveryOrder(created.deliveryOrderId, created.deliveryNo)
      finishStep(order, 'confirm')

      startStep(order, 'writeBack')
      await deps.markPosDelivered(order.poNo, created.deliveryNo)
      finishStep(order, 'writeBack')

      order.status = 'success'
      order.currentStep = null
      emit()
    }
    catch (error) {
      if (error instanceof StopRequestedError) {
        order.status = 'stopped'
        order.message = '已停止，可再次生成继续处理'
      }
      else {
        order.status = 'error'
        if (order.currentStep)
          order.steps[order.currentStep] = 'error'
        order.message = describeError(error, '处理失败，请稍后重试')
      }
      emit()
    }
  }

  const succeeded = orders.filter(
    order => order.status === 'success' && order.deliveryOrderId && order.deliveryNo,
  )

  if (succeeded.length === 0) {
    print.status = 'skipped'
    print.message = '没有成功的送货单可导出'
    emit()
    return { orders, print }
  }

  print.status = 'process'
  emit()
  try {
    const file = await deps.printDeliveryOrders(
      succeeded.map(order => order.deliveryOrderId!),
      succeeded.map(order => order.deliveryNo!),
    )
    deps.downloadFile(file.fileName, file.blob)
    print.status = 'finish'
    print.fileName = file.fileName
    emit()
    return { orders, print, file }
  }
  catch (error) {
    print.status = 'error'
    print.message = describeError(error, '送货单导出失败，请到 SCM 手动打印')
    emit()
    return { orders, print }
  }
}
