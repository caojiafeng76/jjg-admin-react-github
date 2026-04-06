import { Button, Empty, Tag } from 'antd'
import { PencilSquareIcon } from '@heroicons/react/24/outline'

import type { PrecisionFinishingCuttingWithEmployee } from '@/services/apiPrecisionFinishingCuttings'

interface Props {
  loading: boolean
  data: PrecisionFinishingCuttingWithEmployee[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  onEdit: (record: PrecisionFinishingCuttingWithEmployee) => void
}

export default function PrecisionFinishingCuttingMobileList({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  onEdit,
}: Props) {
  if (!loading && data.length === 0) {
    return (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无精加工切割单" />
    )
  }

  return (
    <div className="space-y-3">
      {data.map((record) => {
        const selected = selectedRowKeys.includes(record.id)

        return (
          <article
            key={record.id}
            onClick={() => onSelect(selected ? [] : [record.id])}
            className={
              selected
                ? 'rounded-3xl border border-slate-900 bg-slate-900 px-4 py-4 text-white shadow-[0_18px_40px_rgba(15,23,42,0.16)]'
                : 'rounded-3xl border border-slate-200 bg-white px-4 py-4 text-slate-900 shadow-[0_10px_25px_rgba(15,23,42,0.06)]'
            }
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div
                  className={
                    selected ? 'text-xs text-slate-300' : 'text-xs text-slate-400'
                  }
                >
                  {record.created_at
                    ? new Date(record.created_at).toLocaleString('zh-CN')
                    : '-'}
                </div>
                <div
                  className={
                    selected ? 'mt-1 text-sm text-slate-200' : 'mt-1 text-sm text-slate-500'
                  }
                >
                  {record.customer || '-'}
                </div>
                <div className="mt-1 text-lg font-bold tracking-tight">
                  {record.project_no}
                </div>
                <div
                  className={
                    selected ? 'mt-1 text-sm text-slate-200' : 'mt-1 text-sm text-slate-500'
                  }
                >
                  {record.product_model || '-'} / {record.customer_model || '-'}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Tag color={record.is_audited ? 'success' : 'default'}>
                    {record.is_audited ? '已审核' : '待审核'}
                  </Tag>
                  <Tag color="processing">{record.target_workshop}</Tag>
                </div>
              </div>

              <div className="rounded-2xl bg-black/5 px-3 py-2 text-right">
                <div className="text-[11px] tracking-[0.18em] uppercase opacity-60">
                  转移数量
                </div>
                <div className="mt-1 text-base font-semibold">
                  {record.transfer_quantity}
                </div>
              </div>
            </div>

            <div
              className={
                selected
                  ? 'mt-4 grid grid-cols-2 gap-3 text-sm text-slate-100'
                  : 'mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600'
              }
            >
              <div className="rounded-2xl bg-black/5 px-3 py-3">
                <div className="text-[11px] tracking-[0.18em] uppercase opacity-60">
                  长料
                </div>
                <div className="mt-1 font-semibold">
                  {record.long_material_length_mm} / {record.long_material_quantity}
                </div>
              </div>
              <div className="rounded-2xl bg-black/5 px-3 py-3">
                <div className="text-[11px] tracking-[0.18em] uppercase opacity-60">
                  操作人
                </div>
                <div className="mt-1 font-semibold">
                  {record.operator_names.join('、') || '-'}
                </div>
              </div>
              <div className="rounded-2xl bg-black/5 px-3 py-3">
                <div className="text-[11px] tracking-[0.18em] uppercase opacity-60">
                  原料不良数
                </div>
                <div className="mt-1 font-semibold">
                  {record.raw_material_defect_count}
                </div>
              </div>
              <div className="rounded-2xl bg-black/5 px-3 py-3">
                <div className="text-[11px] tracking-[0.18em] uppercase opacity-60">
                  加工不良数
                </div>
                <div className="mt-1 font-semibold">
                  {record.processing_defect_count}
                </div>
              </div>
              <div className="rounded-2xl bg-black/5 px-3 py-3">
                <div className="text-[11px] tracking-[0.18em] uppercase opacity-60">
                  接收人
                </div>
                <div className="mt-1 font-semibold">{record.recipient_name}</div>
              </div>
              <div className="rounded-2xl bg-black/5 px-3 py-3">
                <div className="text-[11px] tracking-[0.18em] uppercase opacity-60">
                  检验人
                </div>
                <div className="mt-1 font-semibold">
                  {record.inspector_name || '-'}
                </div>
              </div>
              <div className="rounded-2xl bg-black/5 px-3 py-3">
                <div className="text-[11px] tracking-[0.18em] uppercase opacity-60">
                  长度
                </div>
                <div className="mt-1 font-semibold">{record.length_mm ?? '-'}</div>
              </div>
              <div className="rounded-2xl bg-black/5 px-3 py-3">
                <div className="text-[11px] tracking-[0.18em] uppercase opacity-60">
                  审核时间
                </div>
                <div className="mt-1 font-semibold">
                  {record.audited_at
                    ? new Date(record.audited_at).toLocaleString('zh-CN')
                    : '未审核'}
                </div>
              </div>
              <div className="col-span-2 rounded-2xl bg-black/5 px-3 py-3">
                <div className="text-[11px] tracking-[0.18em] uppercase opacity-60">
                  不良原因
                </div>
                <div className="mt-1 text-sm leading-6 font-medium wrap-break-word whitespace-pre-wrap">
                  {record.defect_reason?.trim() || '无'}
                </div>
              </div>
              <div className="col-span-2 rounded-2xl bg-black/5 px-3 py-3">
                <div className="text-[11px] tracking-[0.18em] uppercase opacity-60">
                  备注
                </div>
                <div className="mt-1 text-sm leading-6 font-medium wrap-break-word whitespace-pre-wrap">
                  {record.remark?.trim() || '无备注'}
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                type={selected ? 'default' : 'primary'}
                ghost={selected}
                icon={<PencilSquareIcon className="size-4" />}
                disabled={record.is_audited}
                onClick={(event) => {
                  event.stopPropagation()
                  onEdit(record)
                }}
              >
                {record.is_audited ? '已审核不可编辑' : '编辑'}
              </Button>
            </div>
          </article>
        )
      })}
    </div>
  )
}