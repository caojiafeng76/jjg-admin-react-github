import { App, Button, Card, Typography } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'

import { useProductionOrder } from './useProductionOrders'
import {
  useDeleteProductionOrderItems,
  useProductionOrderItems,
} from './useProductionOrderItems'
import ProductionOrderItemMobileList from './ProductionOrderItemMobileList'
import type {
  ProductionOrderItem,
  ProductionOrderItemWithMachine,
} from '@/services/apiProductionOrderItems'

const { Paragraph, Title } = Typography

export default function MobileProductionOrderDetailPage() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { orderId } = useParams<{ orderId: string }>()
  const { data: order, isLoading } = useProductionOrder(orderId)
  const { data: items = [], isLoading: itemsLoading } =
    useProductionOrderItems(orderId)
  const deleteMutation = useDeleteProductionOrderItems()

  const canEdit = !order?.is_audited
  const typedItems = items as ProductionOrderItemWithMachine[]

  const handleDeleteItem = async (ids: string[]) => {
    try {
      await deleteMutation.mutateAsync(ids)
      message.success('工序明细删除成功')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除失败')
    }
  }

  if (!orderId || (!order && !isLoading)) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-3xl text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          <Title level={4}>未找到工单</Title>
          <Paragraph type="secondary">当前工单不存在或已被删除。</Paragraph>
          <Button type="primary" onClick={() => navigate('/production-order')}>
            返回我的工单
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto px-4 pt-4 pb-52">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] dark:border-slate-700/80 dark:bg-slate-900/90">
          <div className="text-[11px] font-semibold tracking-[0.28em] text-slate-400 uppercase dark:text-slate-500">
            Production Order
          </div>
          <Title level={3} style={{ marginTop: 12, marginBottom: 8 }}>
            工单详情
          </Title>
          <Paragraph className="mb-0 text-slate-500 dark:text-slate-400">
            查看当日工单信息，并在独立页面中维护工序明细。
          </Paragraph>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-[0_10px_25px_rgba(15,23,42,0.06)] dark:border-slate-700/80 dark:bg-slate-900/90">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs tracking-[0.24em] text-slate-400 uppercase dark:text-slate-500">
                Order Summary
              </div>
              <div className="mt-1 text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                {order?.order_date}
              </div>
              <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {order?.employee?.name || '-'}
              </div>
            </div>

            <div
              className={
                order?.is_audited
                  ? 'rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300'
                  : 'rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }
            >
              {order?.is_audited ? '已审核' : '待审核'}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600 dark:text-slate-400">
            <div className="rounded-2xl bg-slate-50 px-3 py-3 dark:bg-slate-800/60">
              <div className="text-[11px] tracking-[0.18em] text-slate-400 uppercase dark:text-slate-500">
                出勤工时
              </div>
              <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                {order?.work_hours ?? 0} 小时
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 px-3 py-3 dark:bg-slate-800/60">
              <div className="text-[11px] tracking-[0.18em] text-slate-400 uppercase dark:text-slate-500">
                班别
              </div>
              <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                {order?.shift || '白班'}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 px-3 py-3 dark:bg-slate-800/60">
              <div className="text-[11px] tracking-[0.18em] text-slate-400 uppercase dark:text-slate-500">
                审核时间
              </div>
              <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                {order?.audited_at
                  ? dayjs(order.audited_at).format('YYYY-MM-DD HH:mm:ss')
                  : '未审核'}
              </div>
            </div>
            <div className="col-span-2 rounded-2xl bg-slate-50 px-3 py-3 dark:bg-slate-800/60">
              <div className="text-[11px] tracking-[0.18em] text-slate-400 uppercase dark:text-slate-500">
                备注
              </div>
              <div className="mt-1 text-sm leading-6 font-medium wrap-break-word whitespace-pre-wrap text-slate-900 dark:text-slate-100">
                {order?.remark?.trim() || '无备注'}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-[0_10px_25px_rgba(15,23,42,0.06)] dark:border-slate-700/80 dark:bg-slate-900/90">
          <div className="mb-4 text-xs tracking-[0.24em] text-slate-400 uppercase dark:text-slate-500">
            Process Items
          </div>
          <div className="mb-4 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
            工序明细
          </div>

          <ProductionOrderItemMobileList
            loading={isLoading || itemsLoading}
            data={typedItems}
            onEdit={(item: ProductionOrderItem) => {
              navigate('/production-order/scan', {
                state: {
                  returnTo: `/production-order/${orderId}`,
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

      <div
        className="fixed inset-x-0 z-40 border-t border-white/70 bg-white/92 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 82px)' }}
      >
        <div className="mx-auto grid max-w-2xl grid-cols-3 gap-3">
          <Button
            className="h-11 rounded-2xl"
            onClick={() => navigate('/production-order')}
          >
            返回列表
          </Button>
          <Button
            className="h-11 rounded-2xl"
            disabled={!canEdit}
            onClick={() => navigate(`/production-order/${orderId}/edit`)}
          >
            编辑工单
          </Button>
          <Button
            type="primary"
            className="h-11 rounded-2xl"
            disabled={!canEdit}
            onClick={() => {
              navigate('/production-order/scan', {
                state: {
                  returnTo: `/production-order/${orderId}`,
                  orderId,
                },
              })
            }}
          >
            添加工序
          </Button>
        </div>
      </div>
    </div>
  )
}
