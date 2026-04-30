import { Button, Descriptions, Empty, Tag } from 'antd'
import { PencilSquareIcon } from '@heroicons/react/16/solid'

import type { MaterialTransferWithEmployee } from '@/services/apiMaterialTransfers'

interface Props {
  selectedRecord: MaterialTransferWithEmployee | null
  onEdit?: (record: MaterialTransferWithEmployee) => void
  editDisabled?: boolean
}

export default function MaterialTransferDetail({
  selectedRecord,
  onEdit,
  editDisabled = false,
}: Props) {
  if (!selectedRecord) {
    return (
      <div className="flex h-full items-center justify-center">
        <Empty
          description="点击上方表格行查看详情"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
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

  return (
    <div className="h-full overflow-auto p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
        <Tag color={is_audited ? 'success' : 'default'}>
          {is_audited ? '已审核' : '待审核'}
        </Tag>
        {customer && <span className="font-medium">{customer}</span>}
        {customer && project_no && <span className="text-slate-400">·</span>}
        <span className="font-medium">{project_no}</span>
        {product_model && (
          <>
            <span className="text-slate-400">·</span>
            <span className="text-slate-600">{product_model}</span>
          </>
        )}
        {onEdit && (
          <Button
            size="small"
            type="text"
            icon={<PencilSquareIcon className="h-4 w-4" />}
            onClick={() => onEdit(selectedRecord)}
            disabled={editDisabled}
            className="ml-auto"
          >
            编辑
          </Button>
        )}
      </div>
      <Descriptions
        size="small"
        column={{ xs: 1, sm: 2, md: 3, lg: 4 }}
        bordered
        items={[
          {
            key: 'customer',
            label: '客户',
            children: customer || '-',
          },
          {
            key: 'recipient_name',
            label: '接收人',
            children: recipient_name || '-',
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
            children: audited_at
              ? new Date(audited_at).toLocaleString('zh-CN')
              : '-',
          },
          {
            key: 'remark',
            label: '备注',
            children: remark || '-',
            span: 2,
          },
        ]}
      />
    </div>
  )
}
