import { useMemo } from 'react'
import { Table, TableColumnsType, TableProps } from 'antd'
import type { WorkshopOrder } from './index'

interface Props {
  loading: boolean
  data: WorkshopOrder[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  scrollY?: number
  rowHeight?: number
}

export default function WorkshopOrderTable({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  scrollY = 400,
  rowHeight = 40,
}: Props) {
  const columns: TableColumnsType<WorkshopOrder> = useMemo(
    () => [
      {
        title: '#',
        render: (_text, _record, index) => index + 1,
        fixed: 'left',
        key: '#',
        ellipsis: false,
      },
      {
        title: '产品交货日期',
        dataIndex: 'product_delivery_date',
        fixed: 'left',
        key: 'product_delivery_date',
      },
      {
        title: '客户',
        dataIndex: 'customer',
        ellipsis: true,
        key: 'customer',
      },
      {
        title: '项目号',
        dataIndex: 'project_no',
        fixed: 'left',
        key: 'project_no',
      },
      {
        title: '产品型号',
        dataIndex: 'product_model',
        fixed: 'left',
        key: 'product_model',
      },
      {
        title: '客户型号',
        dataIndex: 'customer_model',
        ellipsis: true,
        key: 'customer_model',
      },
      {
        title: '比重',
        dataIndex: 'weight_per_meter_kg',
        key: 'weight_per_meter_kg',
      },
      {
        title: '长度',
        dataIndex: 'length_mm',
        fixed: 'left',
        key: 'length_mm',
      },
      {
        title: '支数',
        dataIndex: 'order_quantity',
        key: 'order_quantity',
      },
      {
        title: '表面处理',
        dataIndex: 'product_category',
        ellipsis: true,
        key: 'product_category',
      },
      {
        title: '颜色',
        dataIndex: 'color_name',
        ellipsis: true,
        key: 'color_name',
      },
      {
        title: '包装方式',
        dataIndex: 'package_name',
        ellipsis: true,
        key: 'package_name',
      },
      {
        title: '材质',
        dataIndex: 'material_name',
        ellipsis: true,
        key: 'material_name',
      },
      {
        title: '料号',
        dataIndex: 'material_code',
        ellipsis: true,
        key: 'material_code',
      },
    ],
    [],
  )

  const rowSelection: TableProps<WorkshopOrder>['rowSelection'] = {
    selectedRowKeys,
    onChange: onSelect,
  }

  // 自定义单元格样式
  const components = useMemo(
    () => ({
      body: {
        cell: (props: any) => {
          const { children, ...restProps } = props
          // 检查列是否禁用了 ellipsis
          const column = (restProps as any).column
          const hasEllipsis = column?.ellipsis !== false

          return (
            <td
              {...restProps}
              style={{
                ...restProps.style,
                whiteSpace: hasEllipsis ? 'nowrap' : 'normal',
                overflow: hasEllipsis ? 'hidden' : 'visible',
                textOverflow: hasEllipsis ? 'ellipsis' : 'clip',
                padding: '8px 12px',
                height: `${rowHeight}px`,
              }}
            >
              {children}
            </td>
          )
        },
      },
    }),
    [rowHeight],
  )

  return (
    <Table<WorkshopOrder>
      rowKey={(record) => record.id || ''}
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      scroll={{ y: scrollY }}
      size="small"
      pagination={false}
      style={{
        fontSize: '12px',
      }}
      components={components}
    />
  )
}
