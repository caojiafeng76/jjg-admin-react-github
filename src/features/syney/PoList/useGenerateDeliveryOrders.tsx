import type {
  DeliveryOrderBatchDeps,
  DeliveryOrderBatchSnapshot,
} from './deliveryOrderBatch'
import { useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'

import { useRef, useState } from 'react'
import {
  addSyneySafePartDetail,
  confirmSyneyDeliveryOrder,
  createSyneyDeliveryOrder,
  planSyneySafeParts,
  printSyneyDeliveryOrders,
} from '@/services/apiSyneyDeliveryOrder'
import { getPosWithItemsByNos, markPosDelivered } from '@/services/apiSyneyPos'
import { getSyneySafePartSettings } from '@/services/apiSyneySafePartSettings'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import { syneyPoKeys } from '../queryKeys'
import { useTableSelection } from '../useTableSelection'
import { runDeliveryOrderBatch, uniquePoNos } from './deliveryOrderBatch'
import { buildSafePartInfoRows, toSafePartSourceRows } from './safePartInfoRows'
import { useSelectedPos } from './useSelectedPos'

function downloadBlob(fileName: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function loadSafePartSources(poNos: string[]) {
  const [rows, settings] = await Promise.all([
    getPosWithItemsByNos(poNos),
    getSyneySafePartSettings(),
  ])

  const sources = new Map<string, ReturnType<typeof toSafePartSourceRows>>()
  rows.forEach(({ po, items }) => {
    if (!po.No)
      return
    const sourceRows = toSafePartSourceRows(
      buildSafePartInfoRows(
        { No: po.No, EndDate: po.EndDate, SONo: po.SONo, SerialNo: po.SerialNo, items },
        settings,
      ),
    )
    sources.set(po.No, [...(sources.get(po.No) ?? []), ...sourceRows])
  })
  return sources
}

const deps: DeliveryOrderBatchDeps = {
  loadSafePartSources,
  createDeliveryOrder: createSyneyDeliveryOrder,
  planSafeParts: planSyneySafeParts,
  addSafePartDetail: addSyneySafePartDetail,
  confirmDeliveryOrder: confirmSyneyDeliveryOrder,
  markPosDelivered,
  printDeliveryOrders: printSyneyDeliveryOrders,
  downloadFile: downloadBlob,
}

export function useGenerateDeliveryOrders() {
  const { message, modal } = App.useApp()
  const queryClient = useQueryClient()
  const { setTableSelectedKeys } = useTableSelection()
  const { isLoading, selectedPosList } = useSelectedPos()

  const [open, setOpen] = useState(false)
  const [running, setRunning] = useState(false)
  const [stopping, setStopping] = useState(false)
  const [snapshot, setSnapshot] = useState<DeliveryOrderBatchSnapshot | null>(null)
  const [file, setFile] = useState<{ fileName: string, blob: Blob } | null>(null)
  const stopRef = useRef(false)

  async function run(poNos: string[]) {
    stopRef.current = false
    setStopping(false)
    setFile(null)
    setSnapshot(null)
    setRunning(true)
    setOpen(true)

    try {
      const result = await runDeliveryOrderBatch({
        poNos,
        deps,
        onUpdate: setSnapshot,
        shouldStop: () => stopRef.current,
      })
      setFile(result.file ?? null)

      const successCount = result.orders.filter(order => order.status === 'success').length
      if (successCount === result.orders.length) {
        message.success(feedbackText.batch('生成', '送货单', successCount))
      }
      else {
        message.warning(`送货单生成完成：成功 ${successCount} 张，未完成 ${result.orders.length - successCount} 张`)
      }
    }
    catch (error) {
      message.error(getUserErrorMessage(error, feedbackText.failed('生成', '送货单')))
    }
    finally {
      setRunning(false)
      setStopping(false)
      void queryClient.invalidateQueries({ queryKey: syneyPoKeys.all })
    }
  }

  function generateDeliveryOrders() {
    if (running) {
      setOpen(true)
      return
    }

    if (isLoading) {
      message.warning('数据加载中，请稍后再试')
      return
    }

    const poNos = uniquePoNos(selectedPosList.map(({ poInfo }) => poInfo.No))
    if (poNos.length === 0) {
      message.warning(feedbackText.selectRequired('生成送货单'))
      return
    }

    const deliveredNos = uniquePoNos(
      selectedPosList
        .filter(({ poInfo }) => poInfo.DeliveryNo && !['null', 'undefined'].includes(poInfo.DeliveryNo))
        .map(({ poInfo }) => poInfo.No),
    )

    modal.confirm({
      title: `为 ${poNos.length} 个订单号生成送货单？`,
      content: (
        <div className="flex flex-col gap-1">
          <div>{`订单号：${poNos.join('、')}`}</div>
          <div>将在西尼 SCM 中逐张生成送货单、填写安全部件并供应商确认，完成后自动下载送货单。</div>
          {deliveredNos.length > 0
            ? (
                <div className="text-amber-600 dark:text-amber-400">
                  {`其中 ${deliveredNos.join('、')} 已有送货单号，SCM 中没有可送明细时会提示失败。`}
                </div>
              )
            : null}
        </div>
      ),
      okText: '开始生成',
      onOk: () => {
        void run(poNos)
      },
    })
  }

  function requestStop() {
    stopRef.current = true
    setStopping(true)
  }

  function redownload() {
    if (file)
      downloadBlob(file.fileName, file.blob)
  }

  function close() {
    if (running)
      return
    setOpen(false)
    if (snapshot?.orders.some(order => order.status === 'success'))
      setTableSelectedKeys([])
  }

  return {
    generateDeliveryOrders,
    open,
    running,
    stopping,
    snapshot,
    hasFile: Boolean(file),
    requestStop,
    redownload,
    close,
  }
}
