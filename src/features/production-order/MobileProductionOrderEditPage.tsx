import type {
  ProductionOrderItem,
  ProductionOrderItemWithMachine,
} from '@/services/apiProductionOrderItems'
import type { ProductionOrderShift } from '@/services/apiProductionOrders'
import type { MobileBottomSelectOption } from '@/ui/mobile/MobileBottomSelectSheet'
import { App, Button, DatePicker, Form, Input, Typography } from 'antd'

import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MobileBottomSelectSheet from '@/ui/mobile/MobileBottomSelectSheet'
import MobileNumberInput from '@/ui/mobile/MobileNumberInput'
import ProductionOrderItemMobileList from './ProductionOrderItemMobileList'
import {
  useDeleteProductionOrderItems,
  useProductionOrderItems,
} from './useProductionOrderItems'
import {
  useProductionOrder,
  useUpdateProductionOrder,
} from './useProductionOrders'

const { Paragraph, Title } = Typography

interface OrderFormValues {
  order_date: dayjs.Dayjs
  shift: ProductionOrderShift
  work_hours: number
  extra_qualified_hours?: number
  remark?: string
}

const SHIFT_OPTIONS: MobileBottomSelectOption[] = [
  { value: '白班', label: '白班' },
  { value: '夜班', label: '夜班' },
]

export default function MobileProductionOrderEditPage() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { orderId } = useParams<{ orderId: string }>()
  const { data: order, isLoading } = useProductionOrder(orderId)
  const { data: items = [], isLoading: itemsLoading }
    = useProductionOrderItems(orderId)
  const updateMutation = useUpdateProductionOrder()
  const deleteMutation = useDeleteProductionOrderItems()
  const [form] = Form.useForm<OrderFormValues>()
  const [isShiftSheetOpen, setIsShiftSheetOpen] = useState(false)

  const canEdit = !order?.is_audited
  const currentShift = Form.useWatch('shift', form)
  const typedItems = useMemo(
    () => items as ProductionOrderItemWithMachine[],
    [items],
  )

  useEffect(() => {
    if (!order) {
      return
    }

    form.setFieldsValue({
      order_date: dayjs(order.order_date),
      shift: order.shift || '白班',
      work_hours: order.work_hours,
      extra_qualified_hours: order.extra_qualified_hours ?? 0,
      remark: order.remark || undefined,
    })
  }, [form, order])

  const handleDeleteItem = async (ids: string[]) => {
    try {
      await deleteMutation.mutateAsync(ids)
      message.success('工序明细删除成功')
    }
    catch (error) {
      message.error(error instanceof Error ? error.message : '删除失败')
    }
  }

  const handleSubmit = async (values: OrderFormValues) => {
    if (!orderId) {
      return
    }

    try {
      await updateMutation.mutateAsync({
        id: orderId,
        values: {
          order_date: values.order_date.format('YYYY-MM-DD'),
          shift: values.shift,
          work_hours: values.work_hours,
          extra_qualified_hours: values.extra_qualified_hours ?? 0,
          remark: values.remark?.trim() || null,
        },
      })
      message.success('工单更新成功')
      navigate(`/production-order/${orderId}`)
    }
    catch (error) {
      message.error(error instanceof Error ? error.message : '工单更新失败')
    }
  }

  if (!orderId || (!order && !isLoading)) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
          <Title level={4} className="text-slate-900! dark:text-slate-100!">
            未找到工单
          </Title>
          <Paragraph className="text-slate-500! dark:text-slate-400!">
            当前工单不存在或已被删除。
          </Paragraph>
          <Button type="primary" onClick={() => navigate('/production-order')}>
            返回我的工单
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="h-full overflow-y-auto px-4 pt-4 pb-44">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          <section className="rounded-2xl border border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-[11px] font-semibold tracking-[0.2em] text-slate-400 uppercase dark:text-slate-500">
              Edit Order
            </div>
            <Title level={4} className="mt-1.5! mb-1! text-slate-900! dark:text-slate-100!">
              编辑生产工单
            </Title>
            <Paragraph className="mb-0! text-sm text-slate-500 dark:text-slate-400">
              移动端改为独立页面编辑，保存后返回详情页。
            </Paragraph>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item
                name="order_date"
                label="日期"
                rules={[{ required: true, message: '请选择日期' }]}
              >
                <DatePicker
                  className="w-full"
                  format="YYYY-MM-DD"
                  inputReadOnly
                  getPopupContainer={() => document.body}
                />
              </Form.Item>

              <Form.Item label="操作人">
                <Input value={order?.employee?.name || '-'} disabled />
              </Form.Item>

              <Form.Item
                name="shift"
                label="班别"
                rules={[{ required: true, message: '请选择班别' }]}
              >
                <button
                  type="button"
                  onClick={() => setIsShiftSheetOpen(true)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100"
                >
                  {currentShift || '请选择班别'}
                </button>
              </Form.Item>

              <Form.Item
                name="work_hours"
                label="出勤工时(小时)"
                rules={[{ required: true, message: '请输入出勤工时' }]}
              >
                <MobileNumberInput
                  min={0}
                  step={0.5}
                  keyboardMode="decimal"
                  className="w-full"
                />
              </Form.Item>

              <Form.Item name="extra_qualified_hours" label="零工工时(小时)">
                <MobileNumberInput
                  min={0}
                  step={0.5}
                  precision={2}
                  keyboardMode="decimal"
                  className="w-full"
                />
              </Form.Item>

              <Form.Item name="remark" label="备注" className="mb-0!">
                <Input.TextArea rows={3} placeholder="请输入备注" />
              </Form.Item>
            </Form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs tracking-[0.2em] text-slate-400 uppercase dark:text-slate-500">
              Process Items
            </div>
            <div className="mt-1 mb-3 text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              工序明细
            </div>

            <ProductionOrderItemMobileList
              loading={isLoading || itemsLoading}
              data={typedItems}
              onEdit={(item: ProductionOrderItem) => {
                navigate('/production-order/scan', {
                  state: {
                    returnTo: `/production-order/${orderId}/edit`,
                    orderId,
                    editingItem: item,
                  },
                })
              }}
              onDelete={handleDeleteItem}
              showActions={canEdit}
            />
          </section>
        </div>
      </div>

      <div
        className="fixed inset-x-0 z-40 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 74px)' }}
      >
        <div className="mx-auto grid max-w-2xl grid-cols-3 gap-3">
          <Button
            className="h-11 rounded-xl"
            onClick={() => navigate(`/production-order/${orderId}`)}
          >
            返回详情
          </Button>
          <Button
            className="h-11 rounded-xl"
            disabled={!canEdit}
            onClick={() => {
              navigate('/production-order/scan', {
                state: {
                  returnTo: `/production-order/${orderId}/edit`,
                  orderId,
                },
              })
            }}
          >
            添加工序
          </Button>
          <Button
            type="primary"
            className="h-11 rounded-xl"
            disabled={!canEdit}
            loading={updateMutation.isPending}
            onClick={() => form.submit()}
          >
            保存工单
          </Button>
        </div>
      </div>

      <MobileBottomSelectSheet
        open={isShiftSheetOpen}
        title="选择班别"
        options={SHIFT_OPTIONS}
        value={currentShift}
        onClose={() => setIsShiftSheetOpen(false)}
        onSelect={(value) => {
          form.setFieldValue('shift', value)
        }}
      />
    </>
  )
}
