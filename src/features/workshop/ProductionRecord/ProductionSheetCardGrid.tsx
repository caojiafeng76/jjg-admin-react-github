import React, { useState } from 'react'
import { Card, Checkbox, Empty, Spin, Table, Tag, Button, Space } from 'antd'
import { EyeOutlined, DownOutlined, UpOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { ProductionSheetWithRecords } from '@/services/apiProductionSheets'
import type { ProductionRecordWithRelations } from '@/services/apiProductionRecords'

interface Props {
  loading: boolean
  data: ProductionSheetWithRecords[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  onViewDetail?: (sheetId: string) => void
}

export default function ProductionSheetCardGrid({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  onViewDetail,
}: Props) {
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spin tip="加载中..." />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Empty description="暂无数据" />
      </div>
    )
  }

  // 简表列配置
  const simpleColumns = [
    {
      title: '项目号',
      dataIndex: ['order', 'project_no'],
      key: 'project_no',
      width: 120,
      render: (_: unknown, record: ProductionRecordWithRelations) =>
        record.order?.project_no || record.order_id || '-',
    },
    {
      title: '型号',
      dataIndex: ['order', 'product_model'],
      key: 'product_model',
      ellipsis: true,
      render: (_: unknown, record: ProductionRecordWithRelations) =>
        record.order?.product_model || '-',
    },
    {
      title: '数量',
      dataIndex: 'qualified_quantity',
      key: 'qualified_quantity',
      width: 60,
      render: (val: number) => val || 0,
    },
  ]

  // 展开详情的完整列配置
  const fullColumns = [
    {
      title: '项目号',
      dataIndex: ['order', 'project_no'],
      key: 'project_no',
      width: 110,
      render: (_: unknown, record: ProductionRecordWithRelations) =>
        record.order?.project_no || record.order_id || '-',
    },
    {
      title: '型号',
      dataIndex: ['order', 'product_model'],
      key: 'product_model',
      ellipsis: true,
      render: (_: unknown, record: ProductionRecordWithRelations) =>
        record.order?.product_model || '-',
    },
    {
      title: '客户型号',
      dataIndex: ['order', 'customer_model'],
      key: 'customer_model',
      ellipsis: true,
      render: (_: unknown, record: ProductionRecordWithRelations) =>
        record.order?.customer_model || '-',
    },
    {
      title: '长度',
      dataIndex: ['order', 'length_mm'],
      key: 'length_mm',
      width: 70,
      render: (_: unknown, record: ProductionRecordWithRelations) =>
        record.order?.length_mm ?? '-',
    },
    {
      title: '工序',
      dataIndex: ['process', 'process_name'],
      key: 'process_name',
      width: 80,
      render: (_: unknown, record: ProductionRecordWithRelations) =>
        record.process?.process_name || record.process_id || '-',
    },
    {
      title: '合格',
      dataIndex: 'qualified_quantity',
      key: 'qualified_quantity',
      width: 60,
      render: (val: number) => (
        <span className="text-green-600">{val ?? 0}</span>
      ),
    },
    {
      title: '不良',
      dataIndex: 'defective_quantity',
      key: 'defective_quantity',
      width: 60,
      render: (val: number) => <span className="text-red-600">{val ?? 0}</span>,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((sheet) => {
        const isSelected = selectedRowKeys.includes(sheet.id!)
        const isExpanded = expandedCardId === sheet.id
        const hasRecords = sheet.records && sheet.records.length > 0

        return (
          <Card
            key={sheet.id}
            size="small"
            hoverable
            className={isSelected ? 'ring-2 ring-blue-400' : ''}
            title={
              <div className="flex items-center justify-between">
                <span className="text-base font-medium">
                  {sheet.production_date
                    ? dayjs(sheet.production_date).format('M月D日')
                    : '-'}
                </span>
                <Space size="small">
                  <Tag color="blue">{sheet.record_count || 0} 条</Tag>
                  <Tag color="purple">
                    {sheet.working_hours ? `${sheet.working_hours}H` : '-'}
                  </Tag>
                </Space>
              </div>
            }
            extra={
              <Checkbox
                checked={isSelected}
                onChange={(e) => {
                  if (e.target.checked) {
                    onSelect([...selectedRowKeys, sheet.id!])
                  } else {
                    onSelect(selectedRowKeys.filter((k) => k !== sheet.id!))
                  }
                }}
              />
            }
            actions={[
              <Button
                key="toggle"
                type="text"
                size="small"
                icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
                onClick={(e) => {
                  e.stopPropagation()
                  setExpandedCardId(isExpanded ? null : sheet.id || null)
                }}
              >
                {isExpanded ? '收起' : '展开'}
              </Button>,
              ...(onViewDetail
                ? [
                    <Button
                      key="detail"
                      type="text"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        onViewDetail(sheet.id!)
                      }}
                    >
                      详情
                    </Button>,
                  ]
                : []),
            ]}
          >
            {/* 统计区域 */}
            <div className="mb-3 grid grid-cols-2 gap-2">
              <div className="rounded-md bg-green-50 p-2 text-center dark:bg-green-900/20">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  合格总数
                </div>
                <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {sheet.total_qualified_quantity?.toLocaleString() || 0}
                </div>
              </div>
              <div className="rounded-md bg-red-50 p-2 text-center dark:bg-red-900/20">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  不良总数
                </div>
                <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                  {sheet.total_defective_quantity?.toLocaleString() || 0}
                </div>
              </div>
            </div>

            {/* 操作者 */}
            <div className="mb-2 text-sm">
              <span className="text-gray-500 dark:text-gray-400">操作者：</span>
              <span className="text-gray-800 dark:text-gray-200">
                {sheet.operators && sheet.operators.length > 0
                  ? sheet.operators.map((o) => o.name).join('、')
                  : '-'}
              </span>
            </div>

            {/* 备注 */}
            {sheet.remark && (
              <div className="mb-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">备注：</span>
                <span className="text-gray-800 dark:text-gray-200">
                  {sheet.remark}
                </span>
              </div>
            )}

            {/* 记录表格 - 简版（未展开时） */}
            {!isExpanded && hasRecords && (
              <Table
                size="small"
                dataSource={sheet.records?.slice(0, 3)}
                columns={simpleColumns}
                rowKey={(r) => r.id || Math.random().toString()}
                pagination={false}
                className="mt-2"
                footer={
                  (sheet.records?.length || 0) > 3
                    ? () => (
                        <div className="text-center text-xs text-gray-400">
                          ...还有 {(sheet.records?.length || 0) - 3} 条记录
                        </div>
                      )
                    : undefined
                }
              />
            )}

            {/* 记录表格 - 完整版（展开时） */}
            {isExpanded && hasRecords && (
              <div className="mt-2 border-t pt-2">
                <div className="mb-2 text-sm font-medium">完整记录</div>
                <Table
                  size="small"
                  dataSource={sheet.records}
                  columns={fullColumns}
                  rowKey={(r) => r.id || Math.random().toString()}
                  pagination={false}
                  scroll={{ x: 500 }}
                />
              </div>
            )}

            {/* 创建时间 */}
            <div className="mt-2 text-right text-xs text-gray-400">
              {sheet.created_at
                ? dayjs(sheet.created_at).format('MM-DD HH:mm')
                : ''}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
