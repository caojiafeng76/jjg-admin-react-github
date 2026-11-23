import type { TableColumnsType } from 'antd'
import type { PoImportMode } from './PoImportMode'
import type { SyneyPurchaseOrderGroup } from '@/utils/syneyPurchaseOrder'
import { App, Button, Input, Modal, Table } from 'antd'
import { useEffect, useId, useRef, useState } from 'react'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import { fetchSyneyPurchaseOrder } from '@/services/apiSyneyDeliveryOrder'
import { getExistingSyneyProductionNos, importSyneyPurchaseOrder } from '@/services/apiSyneyPurchaseOrder'
import { SYNEY_PURCHASE_ORDER_NO_PATTERN } from '@/services/syneyDeliveryOrderContract'
import StatusPill from '@/ui/StatusPill'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import { buildSyneyPurchaseOrderPayload, prepareSyneyPurchaseOrder } from '@/utils/syneyPurchaseOrder'
import { syneyPoKeys } from '../queryKeys'
import { useSyneySpecs } from '../SpecList/useSyneySpecs'
import { useSyneySafePartSettings } from '../useSyneySafePartSettings'
import { PoImportModePicker } from './PoImportMode'

interface Preview {
  poNo: string
  groups: SyneyPurchaseOrderGroup[]
  existing: Set<string>
}

type PreviewItem = SyneyPurchaseOrderGroup['items'][number]

const columns: TableColumnsType<PreviewItem> = [
  { title: '物料件号', dataIndex: 'PartNo', width: 150 },
  { title: '物料名称', dataIndex: 'PartName', width: 130 },
  { title: '规格', dataIndex: 'Spec', width: 105 },
  {
    title: '参数规格',
    dataIndex: 'ParamSpec',
    width: 100,
    render: (value, item) => item.ParamSpecInferred
      ? <span className="text-warning">{value}（推测）</span>
      : value,
  },
  { title: '核算数量', dataIndex: 'Qty', width: 82, align: 'right' },
  { title: '核算单位', dataIndex: 'Unit', width: 82 },
  { title: '物料备注', dataIndex: 'Remark' },
]

export function SyneyPurchaseOrderModal({
  onClose,
  onModeChange,
}: {
  onClose: () => void
  onModeChange: (mode: PoImportMode) => void
}) {
  const { message } = App.useApp()
  const fieldId = useId()
  const [poNo, setPoNo] = useState('')
  const [preview, setPreview] = useState<Preview>()
  const [isFetching, setIsFetching] = useState(false)
  const lookupRef = useRef<AbortController | null>(null)
  const submitLockRef = useRef(false)
  const { syneySpecs, isLoading: specsLoading, error: specsError } = useSyneySpecs({ isAll: true, silentError: true })
  const { data: settings, isLoading: settingsLoading } = useSyneySafePartSettings()
  const mutation = useMutationWithInvalidation({
    mutationFn: importSyneyPurchaseOrder,
    invalidateQueries: [syneyPoKeys.all],
  })

  useEffect(() => () => lookupRef.current?.abort(), [])

  function changePoNo(value: string) {
    lookupRef.current?.abort()
    lookupRef.current = null
    setPoNo(value)
    setPreview(undefined)
    setIsFetching(false)
  }

  async function fetchPreview() {
    const number = poNo.trim()
    if (!SYNEY_PURCHASE_ORDER_NO_PATTERN.test(number)) {
      message.warning('请输入有效的西尼采购单号')
      return
    }
    if (!syneySpecs || specsLoading || specsError || lookupRef.current || submitLockRef.current)
      return

    const controller = new AbortController()
    lookupRef.current = controller
    setPreview(undefined)
    setIsFetching(true)
    try {
      const [order, existing] = await Promise.all([
        fetchSyneyPurchaseOrder(number, controller.signal),
        getExistingSyneyProductionNos(number, controller.signal),
      ])
      if (!controller.signal.aborted)
        setPreview({ poNo: number, groups: prepareSyneyPurchaseOrder(order, syneySpecs), existing })
    }
    catch (error) {
      if (!controller.signal.aborted)
        message.error(getUserErrorMessage(error, feedbackText.failed('获取', '西尼采购单')))
    }
    finally {
      if (lookupRef.current === controller) {
        controller.abort()
        lookupRef.current = null
        setIsFetching(false)
      }
    }
  }

  const pendingGroups = preview?.groups.filter(group => !preview.existing.has(group.soNo)) ?? []
  const pendingCount = pendingGroups.length
  const hasDateConflict = pendingGroups.some(group => !group.endDate)

  async function confirm() {
    if (!preview || !pendingCount || hasDateConflict || !settings || submitLockRef.current)
      return

    submitLockRef.current = true
    try {
      const result = await mutation.mutateAsync({
        poNo: preview.poNo,
        groups: buildSyneyPurchaseOrderPayload(preview.groups, settings),
      })
      message.success(`${feedbackText.batch('新增', '西尼订单', result.created)}，跳过 ${result.skipped} 条已存在订单`)
      onClose()
    }
    catch (error) {
      message.error(getUserErrorMessage(error, feedbackText.failed('生成', '西尼订单')))
    }
    finally {
      submitLockRef.current = false
    }
  }

  return (
    <Modal
      title="创建订单"
      open
      width={960}
      okText={pendingCount ? `确认生成 ${pendingCount} 条订单` : '确认生成'}
      okButtonProps={{ disabled: !pendingCount || hasDateConflict || isFetching || !settings }}
      confirmLoading={mutation.isPending}
      cancelButtonProps={{ disabled: mutation.isPending }}
      closable={!mutation.isPending}
      keyboard={!mutation.isPending}
      mask={{ closable: !mutation.isPending }}
      onOk={confirm}
      onCancel={onClose}
    >
      <PoImportModePicker value="scm" onChange={onModeChange} disabled={mutation.isPending} />
      <label htmlFor={fieldId} className="mb-2 block">西尼采购单号</label>
      <div className="flex items-center gap-2">
        <Input
          id={fieldId}
          value={poNo}
          maxLength={64}
          allowClear
          placeholder="例如 P202610100541"
          disabled={mutation.isPending}
          onChange={event => changePoNo(event.target.value)}
          onPressEnter={() => void fetchPreview()}
        />
        <Button
          loading={isFetching || specsLoading}
          disabled={mutation.isPending || !!specsError}
          onClick={() => void fetchPreview()}
        >
          获取订单
        </Button>
      </div>

      {specsError && <p role="alert" className="mt-3 text-error">踏板规格加载失败，请重新打开后再试</p>}
      {preview && !settingsLoading && !settings && <p role="alert" className="mt-3 text-error">件号配置加载失败，请重新打开后再试</p>}
      {preview && (
        <>
          <p className="mt-3 mb-2" role="status">
            {pendingCount === 0 ? '该采购单已全部建单' : `待创建 ${pendingCount} 条，已存在 ${preview.groups.length - pendingCount} 条`}
            {' · '}
            共 {preview.groups.reduce((count, group) => count + group.items.length, 0)} 行明细
          </p>
          {hasDateConflict && <p role="alert" className="mb-2 text-error">待创建的生产编号有多个交货日期，请核对西尼采购单</p>}
          <div className="max-h-[50vh] space-y-3 overflow-y-auto">
            {preview.groups.map(group => (
              <section key={group.soNo} aria-label={group.soNo}>
                <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <strong>{group.soNo}</strong>
                  <span>交货日期 {group.dates.join('、')}</span>
                  <StatusPill tone={preview.existing.has(group.soNo) ? 'neutral' : 'info'}>
                    {preview.existing.has(group.soNo) ? '已存在' : '待创建'}
                  </StatusPill>
                  {group.spec && <span>规格 {group.spec}{group.specInferred ? '（推测）' : ''}</span>}
                  {group.brand && <span>商标 {group.brand}</span>}
                </div>
                {group.technique && <p className="mb-1">工艺要求 {group.technique}</p>}
                {group.remark && <p className="mb-1">采购单备注 {group.remark}</p>}
                <Table
                  size="small"
                  rowKey="id"
                  columns={columns}
                  dataSource={group.items}
                  pagination={false}
                  scroll={{ x: 860 }}
                />
              </section>
            ))}
          </div>
        </>
      )}
    </Modal>
  )
}
