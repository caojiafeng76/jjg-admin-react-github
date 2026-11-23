import type { TableColumnsType } from 'antd'
import type { PoImportMode } from './PoImportMode'
import type { SyneyPurchaseOrder } from '@/services/syneyDeliveryOrderContract'
import type { SyneyPurchaseOrderGroup } from '@/utils/syneyPurchaseOrder'
import { Alert, App, Button, Input, Modal, Table } from 'antd'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import { fetchSyneyPurchaseOrder } from '@/services/apiSyneyDeliveryOrder'
import { getExistingSyneyProductionNos, importSyneyPurchaseOrder } from '@/services/apiSyneyPurchaseOrder'
import { SYNEY_PURCHASE_ORDER_NO_PATTERN } from '@/services/syneyDeliveryOrderContract'
import StatusPill from '@/ui/StatusPill'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import {
  buildSyneyPurchaseOrderPayload,
  prepareSyneyLoosePartsOrder,
  prepareSyneyPurchaseOrder,
} from '@/utils/syneyPurchaseOrder'
import { syneyPoKeys } from '../queryKeys'
import { useAllSyneySpecs } from '../SpecList/useSyneySpecs'
import { useSyneySafePartSettings } from '../useSyneySafePartSettings'
import { PoImportModePicker } from './PoImportMode'

interface FetchedOrder {
  poNo: string
  order: SyneyPurchaseOrder
  existing: Set<string>
}

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
  mode,
  onClose,
  onModeChange,
}: {
  mode: 'scm' | 'loose-parts'
  onClose: () => void
  onModeChange: (mode: PoImportMode) => void
}) {
  const { message } = App.useApp()
  const fieldId = useId()
  const [poNo, setPoNo] = useState('')
  const [fetched, setFetched] = useState<FetchedOrder>()
  const [isFetching, setIsFetching] = useState(false)
  const lookupRef = useRef<AbortController | null>(null)
  const submitLockRef = useRef(false)
  const isLoosePartsMode = mode === 'loose-parts'
  const { syneySpecs, isLoading: specsLoading, error: specsError } = useAllSyneySpecs({
    enabled: !isLoosePartsMode,
    silentError: true,
  })
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
    setFetched(undefined)
    setIsFetching(false)
  }

  async function fetchPreview() {
    const number = poNo.trim()
    if (!SYNEY_PURCHASE_ORDER_NO_PATTERN.test(number)) {
      message.warning('请输入有效的西尼采购单号')
      return
    }
    if ((!isLoosePartsMode && (!syneySpecs || specsLoading || specsError))
      || lookupRef.current
      || submitLockRef.current) {
      return
    }

    const controller = new AbortController()
    lookupRef.current = controller
    setFetched(undefined)
    setIsFetching(true)
    try {
      const [order, existing] = await Promise.all([
        fetchSyneyPurchaseOrder(number, controller.signal),
        getExistingSyneyProductionNos(number, controller.signal),
      ])
      if (!controller.signal.aborted)
        setFetched({ poNo: number, order, existing })
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

  const preview: Preview | undefined = useMemo(() => {
    if (!fetched)
      return undefined
    if (isLoosePartsMode) {
      return {
        poNo: fetched.poNo,
        groups: prepareSyneyLoosePartsOrder(fetched.order),
        existing: fetched.existing,
      }
    }
    if (!syneySpecs)
      return undefined
    return {
      poNo: fetched.poNo,
      groups: prepareSyneyPurchaseOrder(fetched.order, syneySpecs),
      existing: fetched.existing,
    }
  }, [fetched, isLoosePartsMode, syneySpecs])

  const hasEmptySoNo = Boolean(fetched?.order.rows.some(row => !row.soNo.trim()))
  const shouldSuggestLooseParts = !isLoosePartsMode && hasEmptySoNo

  const pendingGroups = preview?.groups.filter(group => !preview.existing.has(group.soNo)) ?? []
  const pendingCount = pendingGroups.length
  const hasDateConflict = pendingGroups.some(group => !group.endDate)
  const canConfirm = Boolean(
    preview
    && pendingCount
    && !hasDateConflict
    && !isFetching
    && (isLoosePartsMode || (settings && !shouldSuggestLooseParts)),
  )

  async function confirm() {
    if (!preview || !canConfirm || submitLockRef.current)
      return

    submitLockRef.current = true
    try {
      const result = await mutation.mutateAsync({
        poNo: preview.poNo,
        groups: buildSyneyPurchaseOrderPayload(preview.groups, settings),
      })
      const orderLabel = isLoosePartsMode ? '西尼散件订单' : '西尼订单'
      message.success(`${feedbackText.batch('新增', orderLabel, result.created)}，跳过 ${result.skipped} 条已存在订单`)
      onClose()
    }
    catch (error) {
      message.error(getUserErrorMessage(error, feedbackText.failed('生成', '西尼订单')))
    }
    finally {
      submitLockRef.current = false
    }
  }

  const okText = isLoosePartsMode
    ? (pendingCount ? `确认生成 ${pendingCount} 条散件订单` : '确认生成')
    : (pendingCount ? `确认生成 ${pendingCount} 条订单` : '确认生成')

  return (
    <Modal
      title="创建订单"
      open
      width={960}
      okText={okText}
      okButtonProps={{ disabled: !canConfirm }}
      confirmLoading={mutation.isPending}
      cancelButtonProps={{ disabled: mutation.isPending }}
      closable={!mutation.isPending}
      keyboard={!mutation.isPending}
      mask={{ closable: !mutation.isPending }}
      onOk={confirm}
      onCancel={onClose}
    >
      <PoImportModePicker value={mode} onChange={onModeChange} disabled={mutation.isPending} />
      <label htmlFor={fieldId} className="mb-2 block">西尼采购单号</label>
      <div className="flex items-center gap-2">
        <Input
          id={fieldId}
          value={poNo}
          maxLength={64}
          allowClear
          placeholder={isLoosePartsMode ? '例如 P202611100277' : '例如 P202610100541'}
          disabled={mutation.isPending}
          onChange={event => changePoNo(event.target.value)}
          onPressEnter={() => void fetchPreview()}
        />
        <Button
          loading={isFetching || (!isLoosePartsMode && specsLoading)}
          disabled={mutation.isPending || (!isLoosePartsMode && !!specsError)}
          onClick={() => void fetchPreview()}
        >
          获取订单
        </Button>
      </div>
      {isLoosePartsMode && (
        <p className="mt-2 mb-0 text-xs text-slate-500 dark:text-slate-400">
          散件模式：不匹配踏板规格与安全件，规格固定为「散件」，不分配流水号。
        </p>
      )}

      {!isLoosePartsMode && specsError && (
        <p role="alert" className="mt-3 text-error">踏板规格加载失败，请重新打开后再试</p>
      )}
      {!isLoosePartsMode && preview && !settingsLoading && !settings && (
        <p role="alert" className="mt-3 text-error">件号配置加载失败，请重新打开后再试</p>
      )}
      {shouldSuggestLooseParts && (
        <Alert
          className="mt-3"
          type="info"
          showIcon
          title="该采购单无生产编号，属于散件订单"
          description="散件订单无需匹配踏板规格与安全部件，请切换为「导入散件」直接生成。"
          action={(
            <Button size="small" type="primary" onClick={() => onModeChange('loose-parts')}>
              切换为导入散件
            </Button>
          )}
        />
      )}
      {preview && (
        <>
          <p className="mt-3 mb-2" role="status">
            {pendingCount === 0 ? '该采购单已全部建单' : `待创建 ${pendingCount} 条，已存在 ${preview.groups.length - pendingCount} 条`}
            {' · '}
            共 {preview.groups.reduce((count, group) => count + group.items.length, 0)} 行明细
          </p>
          {hasDateConflict && <p role="alert" className="mb-2 text-error">待创建的订单有多个交货日期，请核对西尼采购单</p>}
          <div className="max-h-[50vh] space-y-3 overflow-y-auto">
            {preview.groups.map(group => (
              <section key={group.soNo || '__empty_so_no__'} aria-label={group.soNo || preview.poNo}>
                <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <strong>{group.soNo || `${preview.poNo}（无生产编号）`}</strong>
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
