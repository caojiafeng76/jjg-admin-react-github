import { Button, Descriptions, Empty, Tag } from 'antd'
import { PencilSquareIcon } from '@heroicons/react/16/solid'

import type { PrecisionCuttingTransferRow } from '@/services/apiPrecisionCuttingTransfers'

interface Props {
  selectedRecord: PrecisionCuttingTransferRow | null
  onEdit?: (record: PrecisionCuttingTransferRow) => void
}

export default function MaterialTransferDetail({
  selectedRecord,
  onEdit,
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
    customer_model,
    long_material_length_mm,
    long_material_quantity,
    raw_material_defect_count,
    processing_defect_count,
    defect_reason,
    outsource_defect_quantity,
    outsource_defect_reason,
    outsource_unit,
    responsible_process,
    process_owner,
    recipient_name,
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
            key: 'customer_model',
            label: '客户型号',
            children: customer_model || '-',
          },
          {
            key: 'long_material_length_mm',
            label: '长料长度(mm)',
            children: long_material_length_mm ?? '-',
          },
          {
            key: 'long_material_quantity',
            label: '长料数量',
            children: long_material_quantity ?? '-',
          },
          {
            key: 'raw_material_defect_count',
            label: '原料不良数',
            children: raw_material_defect_count ?? '-',
          },
          {
            key: 'processing_defect_count',
            label: '加工不良数',
            children: processing_defect_count ?? '-',
          },
          {
            key: 'outsource_defect_quantity',
            label: '外协不良数',
            children: outsource_defect_quantity ?? '-',
          },
          {
            key: 'recipient_name',
            label: '接收人',
            children: recipient_name || '-',
          },
          {
            key: 'outsource_unit',
            label: '外协单位',
            children: outsource_unit || '-',
          },
          {
            key: 'responsible_process',
            label: '责任工序',
            children: responsible_process || '-',
          },
          {
            key: 'process_owner',
            label: '工序负责人',
            children: process_owner || '-',
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
            key: 'defect_reason',
            label: '不良原因',
            children: defect_reason || '-',
            span: 2,
          },
          {
            key: 'outsource_defect_reason',
            label: '外协不良原因',
            children: outsource_defect_reason || '-',
            span: 2,
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
