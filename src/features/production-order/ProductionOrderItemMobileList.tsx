import { App, Button, Empty, Tag } from 'antd'
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'

import type { ProductionOrderItem } from '@/services/apiProductionOrderItems'

interface Props {
  loading: boolean
  data: ProductionOrderItem[]
  onEdit: (item: ProductionOrderItem) => void
  onDelete: (ids: string[]) => void
}

export default function ProductionOrderItemMobileList({
  loading,
  data,
  onEdit,
  onDelete,
}: Props) {
  const { modal } = App.useApp()

  if (!loading && data.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="还没有工序明细，点击下方按钮开始添加"
      />
    )
  }

  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const shouldHighlight =
          Number(item.standard_seconds || 0) === 0 &&
          Number(item.qualified_quantity || 0) > 0

        return (
          <article
            key={item.id}
            className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-[0_10px_25px_rgba(15,23,42,0.06)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs tracking-[0.22em] text-slate-400 uppercase">
                  Step {index + 1}
                </div>
                <div className="mt-1 text-lg font-bold tracking-tight text-slate-900">
                  {item.operation}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {item.project_no}
                  {item.product_model ? ` / ${item.product_model}` : ''}
                </div>
              </div>

              <Tag
                color={shouldHighlight ? 'error' : 'processing'}
                className="mr-0 rounded-full px-3 py-1"
              >
                {shouldHighlight ? '需补标准工时' : '正常'}
              </Tag>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                <div className="text-[11px] tracking-[0.18em] text-slate-400 uppercase">
                  合格数量
                </div>
                <div className="mt-1 font-semibold text-slate-900">
                  {item.qualified_quantity}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                <div className="text-[11px] tracking-[0.18em] text-slate-400 uppercase">
                  加分项
                </div>
                <div className="mt-1 font-semibold text-slate-900">
                  {item.bonus_seconds || 0} 秒
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                <div className="text-[11px] tracking-[0.18em] text-slate-400 uppercase">
                  加工不良
                </div>
                <div className="mt-1 font-semibold text-slate-900">
                  {item.defect_quantity_1 || 0}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                <div className="text-[11px] tracking-[0.18em] text-slate-400 uppercase">
                  原料不良
                </div>
                <div className="mt-1 font-semibold text-slate-900">
                  {item.defect_quantity_2 || 0}
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                type="primary"
                className="flex-1"
                icon={<PencilSquareIcon className="size-4" />}
                onClick={() => onEdit(item)}
              >
                编辑
              </Button>
              <Button
                danger
                className="flex-1"
                icon={<TrashIcon className="size-4" />}
                onClick={() => {
                  modal.confirm({
                    title: '删除工序明细',
                    content: `确认删除工序“${item.operation}”吗？`,
                    okText: '删除',
                    cancelText: '取消',
                    okButtonProps: { danger: true },
                    onOk: async () => {
                      await onDelete([item.id])
                    },
                  })
                }}
              >
                删除
              </Button>
            </div>
          </article>
        )
      })}
    </div>
  )
}
