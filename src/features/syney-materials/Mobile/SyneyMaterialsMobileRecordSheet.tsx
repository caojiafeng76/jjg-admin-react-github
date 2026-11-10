import type {
  SyneyMaterialsStockDirection,
  SyneyMaterialsStockRecord,
} from '@/services/apiSyneyMaterialsStock'
import { App, Button, Drawer, Input } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'

import { SYNEY_MATERIALS_STOCK_LABELS } from '@/services/apiSyneyMaterialsStock'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import {
  useDeleteSyneyMaterialsStock,
  useUpdateSyneyMaterialsStockRemarks,
} from '../Stock/useSyneyMaterialsStock'

export interface SyneyMaterialsMobileRecordSheetProps {
  direction: SyneyMaterialsStockDirection
  record: SyneyMaterialsStockRecord | null
  canManage: boolean
  onClose: () => void
}

/** 手机端出入库记录详情：改备注、删除（数据库回退库存） */
export default function SyneyMaterialsMobileRecordSheet({
  direction,
  record,
  canManage,
  onClose,
}: SyneyMaterialsMobileRecordSheetProps) {
  const label = SYNEY_MATERIALS_STOCK_LABELS[direction]
  const entity = `材料${label}记录`
  const { message, modal } = App.useApp()
  const updateMutation = useUpdateSyneyMaterialsStockRemarks(direction)
  const deleteMutation = useDeleteSyneyMaterialsStock(direction)
  const [remarks, setRemarks] = useState('')

  useEffect(() => {
    setRemarks(record?.remarks ?? '')
  }, [record])

  const remarksChanged = Boolean(record) && remarks.trim() !== (record?.remarks ?? '')

  const handleSaveRemarks = async () => {
    if (!record)
      return
    try {
      await updateMutation.mutateAsync({ id: record.id, remarks })
      message.success(feedbackText.updated(`${label}备注`))
      onClose()
    }
    catch (error) {
      message.error(getUserErrorMessage(error, feedbackText.failed('修改', `${label}备注`)))
    }
  }

  const handleDelete = () => {
    if (!record)
      return
    modal.confirm({
      title: `删除这条${label}记录？`,
      content: direction === 'in'
        ? `删除后库存将减少 ${record.quantity} ${record.unit}`
        : `删除后库存将加回 ${record.quantity} ${record.unit}`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          await deleteMutation.mutateAsync(record.id)
          message.success(`${feedbackText.deleted(entity)}，库存已回退`)
          onClose()
        }
        catch (error) {
          message.error(getUserErrorMessage(error, feedbackText.failed('删除', entity)))
        }
      },
    })
  }

  return (
    <Drawer
      open={Boolean(record)}
      title={`${label}记录`}
      placement="bottom"
      size="auto"
      onClose={onClose}
      styles={{ body: { padding: 16 } }}
    >
      {record
        ? (
            <div className="flex flex-col gap-4 pb-[env(safe-area-inset-bottom)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {record.material_name}
                  </div>
                  <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    规格：{record.specification || '-'}
                  </div>
                  <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {dayjs(record.created_at).format('YYYY-MM-DD HH:mm')}
                  </div>
                </div>
                <div
                  className={`shrink-0 text-2xl font-black tabular-nums ${direction === 'in' ? 'text-green-600' : 'text-red-500'}`}
                >
                  {direction === 'in' ? '+' : '-'}
                  {record.quantity}
                  <span className="ml-1 text-sm font-medium">{record.unit}</span>
                </div>
              </div>

              <div>
                <div className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">备注</div>
                <Input.TextArea
                  value={remarks}
                  onChange={event => setRemarks(event.target.value)}
                  disabled={!canManage}
                  maxLength={500}
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  placeholder="无备注"
                  className="rounded-2xl"
                />
              </div>

              {canManage
                ? (
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        danger
                        size="large"
                        loading={deleteMutation.isPending}
                        onClick={handleDelete}
                        className="h-12 rounded-2xl"
                      >
                        删除
                      </Button>
                      <Button
                        type="primary"
                        size="large"
                        disabled={!remarksChanged}
                        loading={updateMutation.isPending}
                        onClick={handleSaveRemarks}
                        className="h-12 rounded-2xl"
                      >
                        保存备注
                      </Button>
                    </div>
                  )
                : null}
            </div>
          )
        : null}
    </Drawer>
  )
}
