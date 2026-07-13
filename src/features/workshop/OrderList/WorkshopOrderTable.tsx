import { createKeyboardTableRowProps } from '@/utils/keyboardTableRow'
import type {
  CSSProperties,
  Key,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react'
import { memo, useMemo } from 'react'
import { Table, Tag } from 'antd'
import type { TableColumnsType, TableProps } from 'antd'
import dayjs from 'dayjs'
import type { WorkshopOrder } from './index'
import WorkshopOrderQrCell from './WorkshopOrderQrCell'
import {
  getWorkshopOrderStatusColor,
  normalizeWorkshopOrderStatus,
} from './orderStatus'

const SELECTION_COLUMN_WIDTH = 30

const DENSE_TABLE_CELL_STYLE: CSSProperties = {
  fontSize: 12,
  lineHeight: 1.2,
  padding: '4px 6px',
  whiteSpace: 'nowrap',
}

const DENSE_TAG_STYLE: CSSProperties = {
  fontSize: 12,
  lineHeight: '18px',
  marginInlineEnd: 0,
  paddingInline: 4,
}

const DENSE_TABLE_STYLES = {
  root: {
    fontSize: 12,
    lineHeight: 1.2,
  },
} satisfies NonNullable<TableProps<WorkshopOrder>['styles']>

function DenseHeaderCell({
  style,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...props}
      style={{
        ...style,
        ...DENSE_TABLE_CELL_STYLE,
      }}
    />
  )
}

function DenseBodyCell({
  style,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      {...props}
      style={{
        ...style,
        ...DENSE_TABLE_CELL_STYLE,
      }}
    />
  )
}

const DENSE_TABLE_COMPONENTS = {
  body: { cell: DenseBodyCell },
  header: { cell: DenseHeaderCell },
} satisfies NonNullable<TableProps<WorkshopOrder>['components']>

function getTableColumnWidth<RecordType>(
  columns: TableColumnsType<RecordType>,
) {
  return columns.reduce((total, column) => {
    const width = column.width

    return total + (typeof width === 'number' ? width : 0)
  }, 0)
}

function formatClosedAt(value: WorkshopOrder['closed_at']) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : ''
}

interface Props {
  loading: boolean
  data: WorkshopOrder[]
  projectNoOptions: string[]
  modelOptions: string[]
  projectNoFilterValues: string[]
  modelFilterValues: string[]
  selectedRowKeys: Key[]
  onSelect: (keys: Key[]) => void
  onChange?: TableProps<WorkshopOrder>['onChange']
  activeRowId?: string | null
  onRowClick?: (record: WorkshopOrder) => void
  scrollY?: number
  rowHeight?: number
  // 当前页码（从 1 开始），用于序号列按全量数据连续编号
  page?: number
  pageSize?: number
}

function WorkshopOrderTable({
  loading,
  data,
  projectNoOptions,
  modelOptions,
  projectNoFilterValues,
  modelFilterValues,
  selectedRowKeys,
  onSelect,
  onChange,
  activeRowId,
  onRowClick,
  scrollY = 400,
  rowHeight,
  page = 1,
  pageSize = 10,
}: Props) {
  const indexOffset = Math.max((page - 1) * pageSize, 0)
  const columns: TableColumnsType<WorkshopOrder> = useMemo(
    () => [
      {
        title: '#',
        render: (_text, _record, index) => indexOffset + index + 1,
        fixed: 'left',
        key: '#',
        width: 34,
        align: 'center',
      },
      {
        title: '二维码',
        dataIndex: 'id',
        fixed: 'left',
        key: 'qr_code',
        width: 52,
        align: 'center',
        render: (_value, record) => <WorkshopOrderQrCell order={record} />,
      },
      {
        title: '状态',
        dataIndex: 'status',
        fixed: 'left',
        key: 'status',
        width: 66,
        render: (value: WorkshopOrder['status']) => {
          const status = normalizeWorkshopOrderStatus(value)
          return (
            <Tag
              color={getWorkshopOrderStatusColor(status)}
              style={DENSE_TAG_STYLE}
            >
              {status}
            </Tag>
          )
        },
      },
      {
        title: '结案时间',
        dataIndex: 'closed_at',
        fixed: 'left',
        key: 'closed_at',
        width: 112,
        render: formatClosedAt,
      },
      {
        title: '简图',
        dataIndex: 'sketch_file_path',
        fixed: 'left',
        key: 'sketch_file_path',
        width: 54,
        align: 'center',
        render: (value: WorkshopOrder['sketch_file_path']) =>
          value ? <Tag style={DENSE_TAG_STYLE}>有</Tag> : null,
      },
      {
        title: '交货日期',
        dataIndex: 'product_delivery_date',
        fixed: 'left',
        key: 'product_delivery_date',
        width: 78,
      },
      {
        title: '工艺流程',
        dataIndex: 'process_flow',
        fixed: 'left',
        key: 'process_flow',
        width: 118,
      },
      {
        title: '客户',
        dataIndex: 'customer',
        fixed: 'left',
        key: 'customer',
        width: 78,
      },
      {
        title: '项目号',
        dataIndex: 'project_no',
        fixed: 'left',
        key: 'project_no',
        width: 102,
        filters: projectNoOptions.map((projectNo) => ({
          text: projectNo,
          value: projectNo,
        })),
        filteredValue: projectNoFilterValues.length
          ? projectNoFilterValues
          : null,
        filterMultiple: true,
        filterSearch: true,
      },
      {
        title: '产品型号',
        dataIndex: 'product_model',
        fixed: 'left',
        key: 'product_model',
        width: 82,
        filters: modelOptions.map((model) => ({
          text: model,
          value: model,
        })),
        filteredValue: modelFilterValues.length ? modelFilterValues : null,
        filterMultiple: true,
        filterSearch: true,
      },
      {
        title: '客户型号',
        dataIndex: 'customer_model',
        fixed: 'left',
        key: 'customer_model',
        width: 88,
      },
      {
        title: '比重',
        dataIndex: 'weight_per_meter_kg',
        fixed: 'left',
        key: 'weight_per_meter_kg',
        width: 50,
        align: 'right',
      },
      {
        title: '长度(mm)',
        dataIndex: 'length_mm',
        fixed: 'left',
        key: 'length_mm',
        width: 64,
        align: 'right',
      },
      {
        title: '长度公差',
        dataIndex: 'length_tolerance',
        key: 'length_tolerance',
        width: 70,
      },
      {
        title: '支数',
        dataIndex: 'order_quantity',
        fixed: 'left',
        key: 'order_quantity',
        width: 46,
        align: 'right',
      },
      // 以下列不固定，可横向滚动
      {
        title: '表面处理',
        dataIndex: 'product_category',
        key: 'product_category',
        width: 70,
      },
      {
        title: '颜色',
        dataIndex: 'color_name',
        key: 'color_name',
        width: 62,
      },
      {
        title: '包装方式',
        dataIndex: 'package_name',
        key: 'package_name',
        width: 72,
      },
      {
        title: '材质',
        dataIndex: 'material_name',
        key: 'material_name',
        width: 66,
      },
      {
        title: '料号',
        dataIndex: 'material_code',
        key: 'material_code',
        width: 104,
      },
      {
        title: '行备注',
        dataIndex: 'row_remark',
        key: 'row_remark',
        width: 116,
        ellipsis: true,
      },
    ],
    [
      indexOffset,
      modelFilterValues,
      modelOptions,
      projectNoFilterValues,
      projectNoOptions,
    ],
  )

  const rowSelection: TableProps<WorkshopOrder>['rowSelection'] = {
    selectedRowKeys,
    onChange: onSelect,
    columnWidth: SELECTION_COLUMN_WIDTH,
  }

  const tableWidth = getTableColumnWidth(columns) + SELECTION_COLUMN_WIDTH

  return (
    <Table<WorkshopOrder>
      rowKey={(record) => record.id || ''}
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      scroll={{ y: scrollY, x: tableWidth }}
      size="small"
      pagination={false}
      components={DENSE_TABLE_COMPONENTS}
      styles={DENSE_TABLE_STYLES}
      onChange={onChange}
      onRow={(record) => ({
        ...(onRowClick
          ? createKeyboardTableRowProps(
              () => onRowClick(record),
              `打开车间订单 ${record.id}`,
            )
          : {}),
        onClick: () => onRowClick?.(record),
        style: {
          cursor: 'pointer',
          height: rowHeight,
          background:
            activeRowId && record.id === activeRowId ? '#e6f4ff' : undefined,
        },
      })}
    />
  )
}

export default memo(WorkshopOrderTable)
