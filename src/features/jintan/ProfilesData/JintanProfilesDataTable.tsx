import { useMemo } from 'react'
import { Button, Table, TableColumnsType } from 'antd'

import type { JintanProfilesData } from '@/services/apiJintanProfilesData'
import { TableEmpty } from '@/ui/TableState'
import { createKeyboardTableRowProps } from '@/utils/keyboardTableRow'

interface Props {
  loading: boolean
  data: JintanProfilesData[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  page: number
  pageSize: number
  scrollY?: number
  rowHeight?: number
  emptyAction?: React.ReactNode
  /** 打开行详情抽屉（库存/出入库）；不传时不渲染操作列 */
  onOpenDetail?: (record: JintanProfilesData) => void
}

export default function JintanProfilesDataTable({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  page,
  pageSize,
  scrollY = 400,
  rowHeight = 40,
  emptyAction,
  onOpenDetail,
}: Props) {
  const columns: TableColumnsType<JintanProfilesData> = useMemo(() => {
    const base: TableColumnsType<JintanProfilesData> = [
      {
        title: '#',
        key: '#',
        width: 60,
        fixed: 'left',
        render: (_value, _record, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: '型号',
        dataIndex: 'profile_model',
        key: 'profile_model',
        width: 160,
        fixed: 'left',
        render: (value: string | null | undefined) => value || '-',
      },
      {
        title: '名称',
        dataIndex: 'profile_name',
        key: 'profile_name',
        width: 200,
        fixed: 'left',
      },
      {
        title: '规格',
        dataIndex: 'specification',
        key: 'specification',
        width: 150,
        render: (value: string | null | undefined) => value || '-',
      },
      {
        title: '材质',
        dataIndex: 'material',
        key: 'material',
        width: 120,
        render: (value: string | null | undefined) => value || '-',
      },
      {
        title: '备注',
        dataIndex: 'remarks',
        key: 'remarks',
        width: 220,
        render: (value: string | null | undefined) => value || '-',
      },
      {
        title: '更新时间',
        dataIndex: 'updated_at',
        key: 'updated_at',
        width: 180,
        render: (value: string) =>
          value ? new Date(value).toLocaleString('zh-CN') : '-',
      },
    ]

    if (onOpenDetail) {
      base.push({
        title: '库存/出入库',
        key: 'inventory-detail',
        width: 120,
        fixed: 'right',
        render: (_value, record) => (
          <Button
            type="link"
            size="small"
            onClick={(event) => {
              event.stopPropagation()
              onOpenDetail(record)
            }}
          >
            查看
          </Button>
        ),
      })
    }

    return base
  }, [onOpenDetail, page, pageSize])

  const rowSelection = useMemo(
    () => ({
      selectedRowKeys,
      onChange: (keys: React.Key[]) => onSelect(keys),
    }),
    [onSelect, selectedRowKeys],
  )

  return (
    <Table<JintanProfilesData>
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      pagination={false}
      scroll={{ x: onOpenDetail ? 1210 : 1090, y: scrollY }}
      size="small"
      locale={{
        emptyText: (
          <TableEmpty
            title="暂无型材资料"
            description="点击下方按钮创建第一条型材资料"
            action={emptyAction}
          />
        ),
      }}
      rowClassName={(_, index) =>
        index % 2 === 0
          ? 'bg-white dark:bg-slate-800'
          : 'bg-slate-50/60 dark:bg-slate-800/60'
      }
      onRow={(record) => ({
        ...createKeyboardTableRowProps(
          () => onSelect([record.id]),
          `选择型材 ${record.id}`,
        ),
        onClick: () => onSelect([record.id]),
        style: { cursor: 'pointer', height: rowHeight },
      })}
    />
  )
}
