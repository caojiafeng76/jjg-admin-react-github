import { useState, useMemo } from 'react'
import { Table, TableColumnsType, TableProps } from 'antd'
import type { WorkshopOrder } from './index'

interface Props {
  loading: boolean
  data: WorkshopOrder[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
}

export default function WorkshopOrderTable({
  loading,
  data,
  selectedRowKeys,
  onSelect,
}: Props) {
  // 保存每列的宽度
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    '#': 50,
    product_delivery_date: 140,
    project_no: 120,
    product_model: 160,
    length_mm: 100,
    customer_model: 200,
    order_quantity: 80,
    weight_per_meter_kg: 140,
    color_name: 100,
    package_name: 120,
    product_category: 120,
    material_name: 120,
    material_code: 120,
  })

  const handleResize = (dataIndex: string, width: number) => {
    setColumnWidths((prev) => ({
      ...prev,
      [dataIndex]: width,
    }))
  }

  const columns: TableColumnsType<WorkshopOrder> = useMemo(
    () => [
      {
        title: '#',
        render: (_text, _record, index) => index + 1,
        width: columnWidths['#'],
        fixed: 'left',
        key: '#',
        ellipsis: false,
        onHeaderCell: () => ({
          'data-column-key': '#',
          style: { position: 'relative' },
        }),
      },
      {
        title: '产品交货日期',
        dataIndex: 'product_delivery_date',
        width: columnWidths.product_delivery_date,
        fixed: 'left',
        key: 'product_delivery_date',
        onHeaderCell: () => ({
          'data-column-key': 'product_delivery_date',
          style: { position: 'relative' },
        }),
      },
      {
        title: '项目号',
        dataIndex: 'project_no',
        width: columnWidths.project_no,
        fixed: 'left',
        key: 'project_no',
        onHeaderCell: () => ({
          'data-column-key': 'project_no',
          style: { position: 'relative' },
        }),
      },
      {
        title: '产品型号',
        dataIndex: 'product_model',
        width: columnWidths.product_model,
        fixed: 'left',
        key: 'product_model',
        onHeaderCell: () => ({
          'data-column-key': 'product_model',
          style: { position: 'relative' },
        }),
      },
      {
        title: '长度(mm)',
        dataIndex: 'length_mm',
        width: columnWidths.length_mm,
        fixed: 'left',
        key: 'length_mm',
        onHeaderCell: () => ({
          'data-column-key': 'length_mm',
          style: { position: 'relative' },
        }),
      },
      {
        title: '客户型号',
        dataIndex: 'customer_model',
        width: columnWidths.customer_model,
        ellipsis: true,
        fixed: 'left',
        key: 'customer_model',
        onHeaderCell: () => ({
          'data-column-key': 'customer_model',
          style: { position: 'relative' },
        }),
      },
      {
        title: '订支数',
        dataIndex: 'order_quantity',
        width: columnWidths.order_quantity,
        fixed: 'left',
        key: 'order_quantity',
        onHeaderCell: () => ({
          'data-column-key': 'order_quantity',
          style: { position: 'relative' },
        }),
      },
      {
        title: '每米理论重(kg/m)',
        dataIndex: 'weight_per_meter_kg',
        width: columnWidths.weight_per_meter_kg,
        fixed: 'left',
        key: 'weight_per_meter_kg',
        onHeaderCell: () => ({
          'data-column-key': 'weight_per_meter_kg',
          style: { position: 'relative' },
        }),
      },
      {
        title: '颜色名称',
        dataIndex: 'color_name',
        width: columnWidths.color_name,
        ellipsis: true,
        key: 'color_name',
        onHeaderCell: () => ({
          'data-column-key': 'color_name',
          style: { position: 'relative' },
        }),
      },
      {
        title: '包装名称',
        dataIndex: 'package_name',
        width: columnWidths.package_name,
        ellipsis: true,
        key: 'package_name',
        onHeaderCell: () => ({
          'data-column-key': 'package_name',
          style: { position: 'relative' },
        }),
      },
      {
        title: '产品类别',
        dataIndex: 'product_category',
        width: columnWidths.product_category,
        ellipsis: true,
        key: 'product_category',
        onHeaderCell: () => ({
          'data-column-key': 'product_category',
          style: { position: 'relative' },
        }),
      },
      {
        title: '材质名称',
        dataIndex: 'material_name',
        width: columnWidths.material_name,
        ellipsis: true,
        key: 'material_name',
        onHeaderCell: () => ({
          'data-column-key': 'material_name',
          style: { position: 'relative' },
        }),
      },
      {
        title: '料号',
        dataIndex: 'material_code',
        width: columnWidths.material_code,
        ellipsis: true,
        key: 'material_code',
        onHeaderCell: () => ({
          'data-column-key': 'material_code',
          style: { position: 'relative' },
        }),
      },
    ],
    [columnWidths],
  )

  const rowSelection: TableProps<WorkshopOrder>['rowSelection'] = {
    selectedRowKeys,
    onChange: onSelect,
    columnWidth: 60,
  }

  // 自定义表头，添加列宽调整功能
  const components = useMemo(
    () => ({
      header: {
        cell: (props: any) => {
          const { children, ...restProps } = props
          // 从 data-column-key 属性获取列标识
          const dataIndex = (restProps as any)['data-column-key']
          const isResizable = dataIndex && columnWidths[dataIndex] !== undefined

          return (
            <th
              {...restProps}
              style={{
                ...restProps.style,
                position: 'relative',
                padding: 0,
              }}
            >
              <div
                style={{
                  padding: '8px 12px',
                  position: 'relative',
                  height: '100%',
                }}
              >
                {children}
                {isResizable && (
                  <div
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const startX = e.clientX
                      const startWidth = columnWidths[dataIndex]

                      const handleMouseMove = (moveEvent: MouseEvent) => {
                        const diff = moveEvent.clientX - startX
                        const newWidth = Math.max(50, startWidth + diff)
                        handleResize(dataIndex, newWidth)
                      }

                      const handleMouseUp = () => {
                        document.removeEventListener(
                          'mousemove',
                          handleMouseMove,
                        )
                        document.removeEventListener('mouseup', handleMouseUp)
                        document.body.style.cursor = ''
                        document.body.style.userSelect = ''
                      }

                      document.addEventListener('mousemove', handleMouseMove)
                      document.addEventListener('mouseup', handleMouseUp)
                      document.body.style.cursor = 'col-resize'
                      document.body.style.userSelect = 'none'
                    }}
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: '4px',
                      cursor: 'col-resize',
                      backgroundColor: 'transparent',
                      zIndex: 1,
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLElement).style.backgroundColor =
                        '#1890ff'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLElement).style.backgroundColor =
                        'transparent'
                    }}
                  />
                )}
              </div>
            </th>
          )
        },
      },
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
              }}
            >
              {children}
            </td>
          )
        },
      },
    }),
    [columnWidths],
  )

  return (
    <Table<WorkshopOrder>
      rowKey={(record) => record.id || ''}
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      scroll={{ x: 1300, y: 'calc(100vh - 260px)' as any }}
      size="small"
      pagination={false}
      style={{
        fontSize: '12px',
      }}
      components={components}
    />
  )
}
