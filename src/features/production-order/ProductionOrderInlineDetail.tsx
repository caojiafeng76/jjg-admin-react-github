import { Descriptions, Empty, Tag } from 'antd'
import dayjs from 'dayjs'

import type { ProductionOrderListItem } from '@/services/apiProductionOrders'

interface Props {
  selectedRecord: ProductionOrderListItem | null
}

export default function ProductionOrderInlineDetail({ selectedRecord }: Props) {
  if (!selectedRecord) {
    return (
      <div className="flex h-full items-center justify-center">
        <Empty
          description="点击上方表格行查看工单详情"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    )
  }

  const {
    order_date,
    is_audited,
    audited_at,
    work_hours,
    shift,
    positive_qualified_hours,
    extra_qualified_hours,
    total_qualified_hours,
    efficiency,
    remark,
    employee,
  } = selectedRecord

  const formattedAuditedAt = audited_at
    ? dayjs(audited_at).format('YYYY-MM-DD HH:mm:ss')
    : '-'

  const efficiencyText =
    efficiency !== null && efficiency !== undefined
      ? `${(efficiency * 100).toFixed(2)}%`
      : '-'

  return (
    <div className="h-full overflow-auto p-3">
      <Descriptions
        size="small"
        column={4}
        bordered
        title="生产工单信息"
        items={[
          { key: 'order_date', label: '日期', children: order_date },
          {
            key: 'employee',
            label: '操作人',
            children: employee?.name || '-',
          },
          {
            key: 'is_audited',
            label: '审核状态',
            children: (
              <Tag color={is_audited ? 'success' : 'default'}>
                {is_audited ? '已审核' : '待审核'}
              </Tag>
            ),
          },
          {
            key: 'audited_at',
            label: '审核时间',
            children: formattedAuditedAt,
          },
          {
            key: 'work_hours',
            label: '出勤工时',
            children: `${work_hours} 小时`,
          },
          {
            key: 'shift',
            label: '班别',
            children: shift || '白班',
          },
          {
            key: 'positive_qualified_hours',
            label: '正工工时',
            children: `${(positive_qualified_hours ?? 0).toFixed(2)} 小时`,
          },
          {
            key: 'extra_qualified_hours',
            label: '零工工时',
            children: `${(extra_qualified_hours ?? 0).toFixed(2)} 小时`,
          },
          {
            key: 'total_qualified_hours',
            label: '总工时',
            children:
              total_qualified_hours !== null &&
              total_qualified_hours !== undefined
                ? `${total_qualified_hours.toFixed(2)} 小时`
                : '-',
          },
          {
            key: 'efficiency',
            label: '工时效率',
            children: efficiencyText,
          },
          {
            key: 'remark',
            label: '备注',
            span: 4,
            children: remark || '-',
          },
        ]}
      />
    </div>
  )
}
