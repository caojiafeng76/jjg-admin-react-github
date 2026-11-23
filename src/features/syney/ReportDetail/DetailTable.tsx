import type { TableColumnsType, TableProps } from 'antd'
import type { Key } from 'react'
import type { ISyneyItem } from '@/types'
import { formatNumberPadded } from '@utils/helps'

import { Table } from 'antd'
import { useMemo } from 'react'
import { TableEmpty } from '@/ui/TableState'
import { SUMMARY_ROW_CLASS_NAME, zebraRowClassName } from '@/ui/tableStyles'
import { createKeyboardTableRowProps } from '@/utils/keyboardTableRow'
import { toggleTableSelectionKey, useTableSelection } from '../useTableSelection'

interface Props {
  data: ISyneyItem[]
  loading: boolean
  page: number
  pageSize: number
  scrollY?: number
}

export default function DetailTable({
  data,
  loading,
  page,
  pageSize,
  scrollY = 400,
}: Props) {
  const { tableSelectedKeys, setTableSelectedKeys } = useTableSelection()

  const currentPageTotalAmount = useMemo(
    () => data.reduce((sum, item) => sum + Number(item.TaxTotalPrice || 0), 0),
    [data],
  )

  const columns: TableColumnsType<ISyneyItem> = [
    {
      title: '#',
      key: 'index',
      width: 50,
      fixed: 'left',
      align: 'right',
      render: (_text, _record, index) => (
        <span className="tabular-nums">
          {(page - 1) * pageSize + index + 1}
        </span>
      ),
    },
    {
      title: '件号',
      dataIndex: 'PartNo',
      key: 'PartNo',
      width: 200,
      render: (value: string | null) => value || '-',
    },
    {
      title: '名称',
      dataIndex: 'PartName',
      key: 'PartName',
      width: 200,
      render: (value: string | null) => value || '-',
    },
    {
      title: '规格',
      dataIndex: 'Spec',
      key: 'Spec',
      width: 250,
      ellipsis: true,
      render: (value: string | null) => value || '-',
    },
    {
      title: '参数规格',
      dataIndex: 'ParamSpec',
      key: 'ParamSpec',
      width: 200,
      ellipsis: true,
      render: (value: string | null) => value || '-',
    },
    {
      title: '单价',
      dataIndex: 'TaxUnitPrice',
      key: 'TaxUnitPrice',
      width: 120,
      align: 'right',
      render: (text: number) => (
        <span className="text-slate-700 tabular-nums dark:text-slate-200">
          {formatNumberPadded(text)}
        </span>
      ),
    },
    {
      title: '数量',
      dataIndex: 'Qty',
      key: 'Qty',
      width: 90,
      align: 'right',
      render: (value: number | null) => (
        <span className="font-semibold text-slate-700 tabular-nums dark:text-slate-200">
          {value ?? '-'}
        </span>
      ),
    },
    {
      title: '单位',
      dataIndex: 'Unit',
      key: 'Unit',
      width: 80,
      render: (value: string | null) => value || '-',
    },
    {
      title: '小计',
      dataIndex: 'TaxTotalPrice',
      key: 'TaxTotalPrice',
      width: 130,
      align: 'right',
      render: (text: number) => (
        <span className="font-semibold text-slate-700 tabular-nums dark:text-slate-200">
          {formatNumberPadded(text)}
        </span>
      ),
    },
  ]

  const rowSelection: TableProps<ISyneyItem>['rowSelection'] = {
    selectedRowKeys: tableSelectedKeys,
    onChange: (newSelectedRowKeys: Key[]) => {
      setTableSelectedKeys(newSelectedRowKeys)
    },
    preserveSelectedRowKeys: true,
  }

  return (
    <Table<ISyneyItem>
      rowSelection={rowSelection}
      rowKey={record => record.id?.toString() ?? ''}
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={false}
      rowClassName={zebraRowClassName}
      locale={{ emptyText: <TableEmpty title="暂无对账单明细" /> }}
      onRow={record =>
        record.id !== undefined && record.id !== null
          ? createKeyboardTableRowProps(
              () => setTableSelectedKeys(toggleTableSelectionKey(tableSelectedKeys, record.id!)),
              `选择对账明细 ${record.PartNo || record.id}`,
            )
          : {}}
      scroll={{ x: 1100, y: scrollY }}
      summary={() => (
        <Table.Summary fixed>
          <Table.Summary.Row className={SUMMARY_ROW_CLASS_NAME}>
            <Table.Summary.Cell index={0} />
            <Table.Summary.Cell index={1} colSpan={7}>
              <span className="font-medium text-slate-600 dark:text-slate-300">当前页小计</span>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={8} />
            <Table.Summary.Cell index={9} align="right">
              <span className="font-bold text-slate-900 tabular-nums dark:text-slate-100">
                {formatNumberPadded(currentPageTotalAmount)}
              </span>
            </Table.Summary.Cell>
          </Table.Summary.Row>
        </Table.Summary>
      )}
    />
  )
}
