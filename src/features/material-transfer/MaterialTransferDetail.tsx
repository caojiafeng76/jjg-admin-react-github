import { Button, Descriptions } from 'antd'
import { PencilSquareIcon } from '@heroicons/react/16/solid'

import type {
  MaterialTransferOrderProgress,
  MaterialTransferWithEmployee,
} from '@/services/apiMaterialTransfers'
import { OrderProgressCell, OrderStatusCell } from './OrderProgressCell'

interface Props {
  selectedRecord: MaterialTransferWithEmployee | null
  onEdit?: (record: MaterialTransferWithEmployee) => void
  editDisabled?: boolean
  orderProgressMap: Map<string, MaterialTransferOrderProgress>
}

export default function MaterialTransferDetail({
  selectedRecord,
  onEdit,
  editDisabled = false,
  orderProgressMap,
}: Props) {
  if (!selectedRecord) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50">
          <svg
            className="h-8 w-8 text-slate-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59"
            />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-500">点击上方表格行</p>
          <p className="mt-1 text-sm text-slate-400">查看物料转移单详情</p>
        </div>
      </div>
    )
  }

  const {
    customer,
    project_no,
    product_model,
    is_audited,
    recipient_name,
    shift_leader_name,
    inspector_name,
    uploaded_by_name,
    audited_at,
    remark,
  } = selectedRecord

  const projectKey = project_no?.trim()
  const progress = projectKey
    ? orderProgressMap.get(projectKey)
    : undefined

  return (
    <div className="h-full overflow-auto p-4">
      {/* Header Card */}
      <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/80 shadow-sm">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-white/60 p-4 backdrop-blur-sm">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={
                  is_audited
                    ? 'flex h-7 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 pr-2 shadow-sm'
                    : 'flex h-7 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 pr-2 shadow-sm'
                }
              >
                <div
                  className={
                    is_audited
                      ? 'h-1.5 w-1.5 rounded-full bg-emerald-500'
                      : 'h-1.5 w-1.5 rounded-full bg-amber-500'
                  }
                />
                <span
                  className={
                    is_audited
                      ? 'text-xs font-medium text-emerald-600'
                      : 'text-xs font-medium text-amber-600'
                  }
                >
                  {is_audited ? '已审核' : '待审核'}
                </span>
              </div>
              {customer && <span className="font-medium text-slate-700">{customer}</span>}
              {customer && project_no && (
                <span className="text-slate-300">·</span>
              )}
              <span className="font-semibold text-slate-900">{project_no}</span>
              {product_model && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-500">{product_model}</span>
                </>
              )}
            </div>
          </div>
          {onEdit && (
            <Button
              size="small"
              type="primary"
              icon={<PencilSquareIcon className="h-3.5 w-3.5" />}
              onClick={() => onEdit(selectedRecord)}
              disabled={editDisabled}
              className="shrink-0 shadow-sm"
            >
              编辑
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 border-b border-slate-100 bg-slate-50/40 p-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">订单进度</span>
            <OrderProgressCell progress={progress} />
            {progress && progress.orderQuantity != null && (
              <span className="text-xs text-slate-400">
                转移 {progress.transferTotal} / 订单 {progress.orderQuantity}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">订单状态</span>
            <OrderStatusCell progress={progress} />
          </div>
        </div>
        <Descriptions
          size="small"
          column={{ xs: 1, sm: 2, md: 3, lg: 4 }}
          className="[&_.ant-descriptions-item-label]:pl-5 [&_.ant-descriptions-item-label]:text-slate-500 [&_.ant-descriptions-item-content]:pl-2 [&_.ant-descriptions-item-content]:text-slate-700"
          items={[
            {
              key: 'customer',
              label: '客户',
              children: customer || '-',
            },
            {
              key: 'recipient_name',
              label: '接收人',
              children: (
                <span className="font-medium text-slate-700">{recipient_name || '-'}</span>
              ),
            },
            {
              key: 'shift_leader_name',
              label: '当班负责人',
              children: shift_leader_name || '-',
            },
            {
              key: 'inspector_name',
              label: '检验人',
              children: inspector_name || '-',
            },
            {
              key: 'uploaded_by_name',
              label: '数据上传',
              children: uploaded_by_name || '-',
            },
            {
              key: 'audited_at',
              label: '审核时间',
              children: audited_at ? (
                <span className="text-slate-600">
                  {new Date(audited_at).toLocaleString('zh-CN')}
                </span>
              ) : (
                <span className="text-slate-400">-</span>
              ),
            },
            {
              key: 'remark',
              label: '备注',
              children: (
                <span className="text-slate-600">{remark || '-'}</span>
              ),
              span: 2,
            },
          ]}
        />
      </div>
    </div>
  )
}
