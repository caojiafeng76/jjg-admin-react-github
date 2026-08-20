import { memo, useMemo } from 'react'
import {
  Button,
  Grid,
  QRCode,
  Table,
  Tooltip,
  type TableColumnsType,
} from 'antd'

import type { ToolingFixture } from '@/services/apiToolingFixture'
import StatusPill from '@/ui/StatusPill'
import { TableEmpty } from '@/ui/TableState'
import { getToolingFixtureQrValue } from './fixtureDomain'
import ToolingFixtureMobileList from './ToolingFixtureMobileList'
import {
  formatDateOnly,
  getLifecycleTone,
  getStatusTone,
} from './toolingFixturePresentation'

interface ToolingFixtureTableProps {
  loading: boolean
  data: ToolingFixture[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  onEdit: (record: ToolingFixture) => void
  onDelete: (record: ToolingFixture) => void
  onPrint: (record: ToolingFixture) => void
  page: number
  pageSize: number
  scrollY?: number
  emptyAction?: React.ReactNode
}

function formatDate(value: string | null): string {
  return value ? value : '-'
}

function ToolingFixtureTable({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  onEdit,
  onDelete,
  onPrint,
  page,
  pageSize,
  scrollY = 520,
  emptyAction,
}: ToolingFixtureTableProps) {
  const screens = Grid.useBreakpoint()
  const columns = useMemo<TableColumnsType<ToolingFixture>>(
    () => [
      {
        title: '更新日期',
        dataIndex: 'updated_at',
        key: 'updated_at',
        width: 120,
        fixed: 'left',
        render: formatDateOnly,
      },
      {
        title: '序号',
        key: 'index',
        width: 64,
        render: (_value, _record, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: '二维码',
        key: 'qr_code',
        width: 110,
        fixed: 'left',
        render: (_value, record) => (
          <Tooltip title="扫码打开工装操作页">
            <QRCode
              value={getToolingFixtureQrValue(record.qr_token)}
              size={76}
              bordered={false}
            />
          </Tooltip>
        ),
      },
      {
        title: '工装模具编号',
        dataIndex: 'fixture_no',
        key: 'fixture_no',
        width: 150,
        fixed: 'left',
      },
      { title: '类别', dataIndex: 'category', key: 'category', width: 110 },
      {
        title: '适用产品图号',
        dataIndex: 'applicable_product_drawing_no',
        key: 'applicable_product_drawing_no',
        width: 160,
      },
      {
        title: '产品名称',
        dataIndex: 'product_name',
        key: 'product_name',
        width: 140,
        ellipsis: true,
      },
      {
        title: '适用设备',
        dataIndex: 'applicable_equipment',
        key: 'applicable_equipment',
        width: 140,
      },
      {
        title: '存放位置',
        dataIndex: 'storage_location',
        key: 'storage_location',
        width: 130,
      },
      {
        title: '制作日期',
        dataIndex: 'manufactured_date',
        key: 'manufactured_date',
        width: 120,
        render: formatDate,
      },
      {
        title: '制作厂商',
        dataIndex: 'manufacturer',
        key: 'manufacturer',
        width: 140,
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (status: ToolingFixture['status']) => (
          <StatusPill tone={getStatusTone(status)}>{status}</StatusPill>
        ),
      },
      {
        title: '寿命',
        dataIndex: 'lifecycle',
        key: 'lifecycle',
        width: 90,
        render: (lifecycle: ToolingFixture['lifecycle']) => {
          return (
            <StatusPill tone={getLifecycleTone(lifecycle)}>
              {lifecycle}
            </StatusPill>
          )
        },
      },
      {
        title: '上次保养日期',
        dataIndex: 'last_maintenance_date',
        key: 'last_maintenance_date',
        width: 140,
        render: formatDate,
      },
      {
        title: '保养周期（天）',
        dataIndex: 'maintenance_cycle_days',
        key: 'maintenance_cycle_days',
        width: 130,
        align: 'right',
        render: (value: number | null) => (
          <span className="tabular-nums">{value ?? '-'}</span>
        ),
      },
      {
        title: '责任人',
        dataIndex: 'responsible_person',
        key: 'responsible_person',
        width: 110,
      },
      {
        title: '备注',
        dataIndex: 'remarks',
        key: 'remarks',
        width: 220,
        ellipsis: true,
      },
      {
        title: '操作',
        key: 'actions',
        fixed: 'right',
        width: 150,
        render: (_value, record) => (
          <div className="flex gap-2">
            <Button type="link" size="small" onClick={() => onPrint(record)}>
              打印
            </Button>
            <Button type="link" size="small" onClick={() => onEdit(record)}>
              编辑
            </Button>
            <Button
              type="link"
              danger
              size="small"
              onClick={() => onDelete(record)}
            >
              删除
            </Button>
          </div>
        ),
      },
    ],
    [onDelete, onEdit, onPrint, page, pageSize],
  )

  if (!screens.md) {
    return (
      <ToolingFixtureMobileList
        data={data}
        loading={loading}
        selectedRowKeys={selectedRowKeys}
        onSelect={onSelect}
        onEdit={onEdit}
        onDelete={onDelete}
        onPrint={onPrint}
        emptyAction={emptyAction}
      />
    )
  }

  return (
    <Table<ToolingFixture>
      rowKey="id"
      loading={loading}
      dataSource={data}
      columns={columns}
      pagination={false}
      rowSelection={{
        selectedRowKeys,
        onChange: onSelect,
      }}
      scroll={{ x: 2220, y: scrollY }}
      size="small"
      locale={{
        emptyText: (
          <TableEmpty
            title="暂无工装资料"
            description="点击下方按钮创建第一条工装资料"
            action={emptyAction}
          />
        ),
      }}
    />
  )
}

export default memo(ToolingFixtureTable)
