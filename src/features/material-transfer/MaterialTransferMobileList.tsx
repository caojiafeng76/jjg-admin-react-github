import type { MaterialTransferWithEmployee } from '@/services/apiMaterialTransfers'
import { ArchiveBoxIcon, BuildingStorefrontIcon, ClockIcon, PencilSquareIcon } from '@heroicons/react/24/outline'

import { Button, Spin } from 'antd'
import { formatDateTime } from '@/utils/format'

interface Props {
  loading: boolean
  data: MaterialTransferWithEmployee[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  onEdit: (record: MaterialTransferWithEmployee) => void
  editDisabled?: boolean
}

export default function MaterialTransferMobileList({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  onEdit,
  editDisabled = false,
}: Props) {
  if (!loading && data.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
          <ArchiveBoxIcon className="h-8 w-8 text-slate-300 dark:text-slate-600" />
        </div>
        <p className="text-sm text-slate-400">暂无转移单</p>
      </div>
    )
  }

  return (
    <Spin spinning={loading}>
      <div className="space-y-3">
        {data.map((record) => {
          const selected = selectedRowKeys.includes(record.id)

          return (
            <article
              key={record.id}
              onClick={() => onSelect(selected ? [] : [record.id])}
              className={
                selected
                  ? 'group cursor-pointer overflow-hidden rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-sm'
                  : 'group cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800'
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {/* Time badge */}
                  <div
                    className={
                      selected
                        ? 'mb-2 flex items-center gap-1.5 text-xs text-slate-400'
                        : 'mb-2 flex items-center gap-1.5 text-xs text-slate-400'
                    }
                  >
                    <ClockIcon className="h-3 w-3" />
                    {formatDateTime(record.created_at)}
                  </div>

                  {/* Customer */}
                  <div
                    className={
                      selected
                        ? 'text-sm text-slate-300'
                        : 'text-sm text-slate-500'
                    }
                  >
                    {record.customer || '-'}
                  </div>

                  {/* Project No - Hero element */}
                  <div className="mt-1 font-mono text-xl font-bold tracking-tight">
                    {record.project_no}
                  </div>

                  {/* Model info */}
                  <div
                    className={
                      selected
                        ? 'mt-1.5 flex flex-wrap items-center gap-2 text-sm text-slate-300'
                        : 'mt-1.5 flex flex-wrap items-center gap-2 text-sm text-slate-500'
                    }
                  >
                    <span className="font-medium">{record.product_model || '-'}</span>
                    {record.product_model && record.customer_model && (
                      <span className="text-slate-400">/</span>
                    )}
                    <span>{record.customer_model || '-'}</span>
                  </div>

                  {/* Status badges */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <div
                      className={
                        selected
                          ? 'inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white shadow-sm'
                          : record.is_audited
                            ? 'inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600 shadow-sm'
                            : 'inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600 shadow-sm'
                      }
                    >
                      <div
                        className={
                          selected
                            ? 'h-1.5 w-1.5 rounded-full bg-white/60'
                            : record.is_audited
                              ? 'h-1.5 w-1.5 rounded-full bg-emerald-500'
                              : 'h-1.5 w-1.5 rounded-full bg-amber-500'
                        }
                      />
                      {record.is_audited ? '已审核' : '待审核'}
                    </div>
                    <div
                      className={
                        selected
                          ? 'inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white shadow-sm'
                          : 'inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm'
                      }
                    >
                      <BuildingStorefrontIcon className="h-3 w-3" />
                      {record.target_workshop}
                    </div>
                  </div>
                </div>

                {/* Quantity Badge */}
                <div
                  className={
                    selected
                      ? 'shrink-0 rounded-2xl bg-white/10 p-3 text-right backdrop-blur-sm'
                      : 'shrink-0 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 p-3 text-right shadow-sm'
                  }
                >
                  <div
                    className={
                      selected
                        ? 'text-[11px] font-medium tracking-[0.15em] text-white/60 uppercase'
                        : 'text-[11px] font-medium tracking-[0.15em] text-slate-500 uppercase'
                    }
                  >
                    转移数量
                  </div>
                  <div
                    className={
                      selected
                        ? 'mt-1 text-2xl font-bold text-white tabular-nums'
                        : 'mt-1 text-2xl font-bold text-slate-900 tabular-nums'
                    }
                  >
                    {record.transfer_quantity}
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div
                className={
                  selected
                    ? 'mt-4 grid grid-cols-2 gap-2.5 text-sm text-slate-200'
                    : 'mt-4 grid grid-cols-2 gap-2.5 text-sm text-slate-600'
                }
              >
                {[
                  { label: '接收人', value: record.recipient_name },
                  { label: '操作人', value: record.operator_names.join('、') || '-' },
                  { label: '当班负责人', value: record.shift_leader_name || '-' },
                  { label: '检验人', value: record.inspector_name || '-' },
                  { label: '长度', value: record.length_mm ? `${record.length_mm}mm` : '-' },
                  {
                    label: '审核时间',
                    value: formatDateTime(record.audited_at, { withSeconds: true, fallback: '未审核' }),
                  },
                ].map(item => (
                  <div
                    key={item.label}
                    className={
                      selected
                        ? 'rounded-xl bg-white/5 p-2.5 backdrop-blur-sm'
                        : 'rounded-xl bg-slate-50 p-2.5'
                    }
                  >
                    <div
                      className={
                        selected
                          ? 'text-[11px] font-medium tracking-[0.1em] text-white/50 uppercase'
                          : 'text-[11px] font-medium tracking-[0.1em] text-slate-400 uppercase'
                      }
                    >
                      {item.label}
                    </div>
                    <div
                      className={
                        selected
                          ? 'mt-1 font-semibold text-white'
                          : 'mt-1 font-semibold text-slate-700'
                      }
                    >
                      {item.value}
                    </div>
                  </div>
                ))}

                {/* Remark spans full width */}
                <div
                  className={
                    selected
                      ? 'col-span-2 rounded-xl bg-white/5 p-2.5 backdrop-blur-sm'
                      : 'col-span-2 rounded-xl bg-slate-50 p-2.5'
                  }
                >
                  <div
                    className={
                      selected
                        ? 'text-[11px] font-medium tracking-[0.1em] text-white/50 uppercase'
                        : 'text-[11px] font-medium tracking-[0.1em] text-slate-400 uppercase'
                    }
                  >
                    备注
                  </div>
                  <div
                    className={
                      selected
                        ? 'mt-1 text-sm leading-relaxed font-medium text-white'
                        : 'mt-1 text-sm leading-relaxed font-medium text-slate-600'
                    }
                  >
                    {record.remark?.trim() || '无备注'}
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              <div className="mt-4 flex justify-end">
                <Button
                  type={selected ? 'default' : 'primary'}
                  ghost={selected}
                  icon={<PencilSquareIcon className="size-4" />}
                  disabled={editDisabled || record.is_audited}
                  onClick={(event) => {
                    event.stopPropagation()
                    onEdit(record)
                  }}
                  className={selected ? 'border-white/30 text-white hover:border-white hover:bg-white/10' : ''}
                >
                  {record.is_audited ? '已审核不可编辑' : '编辑'}
                </Button>
              </div>
            </article>
          )
        })}
      </div>
    </Spin>
  )
}
