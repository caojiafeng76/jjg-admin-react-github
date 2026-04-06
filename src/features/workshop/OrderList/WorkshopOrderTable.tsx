import { useMemo } from 'react'
import { Table, TableColumnsType, TableProps } from 'antd'
import type { WorkshopOrder } from './index'

interface Props {
  loading: boolean
  data: WorkshopOrder[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  activeRowId?: string | null
  onRowClick?: (record: WorkshopOrder) => void
  scrollY?: number
}

export default function WorkshopOrderTable({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  activeRowId,
  onRowClick,
  scrollY = 400,
}: Props) {
  const columns: TableColumnsType<WorkshopOrder> = useMemo(
    () => [
      {
        title: '#',
        render: (_text, _record, index) => index + 1,
        fixed: 'left',
        key: '#',
        width: 40,
      },
      {
        title: '交货日期',
        dataIndex: 'product_delivery_date',
        fixed: 'left',
        key: 'product_delivery_date',
        width: 100,
      },
      {
        title: '客户',
        dataIndex: 'customer',
        fixed: 'left',
        key: 'customer',
        width: 110,
      },
      {
        title: '项目号',
        dataIndex: 'project_no',
        fixed: 'left',
        key: 'project_no',
        width: 120,
      },
      {
        title: '产品型号',
        dataIndex: 'product_model',
        fixed: 'left',
        key: 'product_model',
        width: 100,
      },
      {
        title: '客户型号',
        dataIndex: 'customer_model',
        fixed: 'left',
        key: 'customer_model',
        width: 110,
      },
      {
        title: '比重',
        dataIndex: 'weight_per_meter_kg',
        fixed: 'left',
        key: 'weight_per_meter_kg',
        width: 65,
      },
      {
        title: '长度(mm)',
        dataIndex: 'length_mm',
        fixed: 'left',
        key: 'length_mm',
        width: 80,
      },
      {
        title: '支数',
        dataIndex: 'order_quantity',
        fixed: 'left',
        key: 'order_quantity',
        width: 60,
      },
      // 以下列不固定，可横向滚动
      {
        title: '表面处理',
        dataIndex: 'product_category',
        key: 'product_category',
        width: 90,
      },
      {
        title: '颜色',
        dataIndex: 'color_name',
        key: 'color_name',
        width: 80,
      },
      {
        title: '包装方式',
        dataIndex: 'package_name',
        key: 'package_name',
        width: 90,
      },
      {
        title: '材质',
        dataIndex: 'material_name',
        key: 'material_name',
        width: 80,
      },
      {
        title: '料号',
        dataIndex: 'material_code',
        key: 'material_code',
        width: 130,
      },
    ],
    [],
  )

  const rowSelection: TableProps<WorkshopOrder>['rowSelection'] = {
    selectedRowKeys,
    onChange: onSelect,
    columnWidth: 32,
  }

  return (
    <Table<WorkshopOrder>
      rowKey={(record) => record.id || ''}
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      scroll={{ y: scrollY, x: 'max-content' }}
      size="small"
      pagination={false}
      style={{ fontSize: 11 }}
      onRow={(record) => ({
        onClick: () => onRowClick?.(record),
        style: {
          cursor: 'pointer',
          background:
            activeRowId && record.id === activeRowId ? '#e6f4ff' : undefined,
        },
      })}
      components={{
        body: {
          cell: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
            <td
              {...props}
              style={{
                ...props.style,
                padding: '3px 8px',
                lineHeight: '1.4',
                whiteSpace: 'nowrap',
              }}
            />
          ),
        },
      }}
    />
  )
}
