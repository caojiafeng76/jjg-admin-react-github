import { DatePicker, Select, Button, Space, Input } from 'antd'
import { useState } from 'react'
import { type Dayjs } from 'dayjs'
import { useQuery } from '@tanstack/react-query'
import { getWorkshopOrders } from '@/services/apiWorkshopOrders'
import { getWorkshopProcesses } from '@/services/apiWorkshopProcesses'
import { getEmployees } from '@/services/apiEmployees'

const { RangePicker } = DatePicker

interface Props {
  onSearch: (params: {
    startDate?: string
    endDate?: string
    order_id?: string
    process_id?: string
    product_model?: string
    operator_id?: string
  }) => void
  onReset: () => void
}

export default function ProductionRecordSearch({ onSearch, onReset }: Props) {
  const [startDate, setStartDate] = useState<Dayjs | null>(null)
  const [endDate, setEndDate] = useState<Dayjs | null>(null)
  const [orderId, setOrderId] = useState<string | undefined>(undefined)
  const [processId, setProcessId] = useState<string | undefined>(undefined)
  const [productModel, setProductModel] = useState<string | undefined>(undefined)
  const [operatorId, setOperatorId] = useState<string | undefined>(undefined)

  // 获取订单列表
  const { data: ordersData } = useQuery({
    queryKey: ['workshop-orders', 1, 1000],
    queryFn: () => getWorkshopOrders({ page: 1, pageSize: 1000 }),
  })

  // 获取工序列表
  const { data: processesData } = useQuery({
    queryKey: ['workshop-processes', 1, 1000],
    queryFn: () => getWorkshopProcesses({ page: 1, pageSize: 1000 }),
  })

  // 获取操作者列表
  const { data: employeesData } = useQuery({
    queryKey: ['employees', 1, 1000],
    queryFn: () => getEmployees({ page: 1, pageSize: 1000 }),
  })

  const handleSearch = () => {
    onSearch({
      startDate: startDate ? startDate.format('YYYY-MM-DD') : undefined,
      endDate: endDate ? endDate.format('YYYY-MM-DD') : undefined,
      order_id: orderId,
      process_id: processId,
      product_model: productModel?.trim() || undefined,
      operator_id: operatorId,
    })
  }

  const handleReset = () => {
    setStartDate(null)
    setEndDate(null)
    setOrderId(undefined)
    setProcessId(undefined)
    setProductModel(undefined)
    setOperatorId(undefined)
    onReset()
  }

  const handleDateRangeChange = (
    dates: null | [Dayjs | null, Dayjs | null],
  ) => {
    if (dates && dates[0] && dates[1]) {
      setStartDate(dates[0])
      setEndDate(dates[1])
    } else {
      setStartDate(null)
      setEndDate(null)
    }
  }

  // 订单选项 - 保存更多信息以便搜索
  const orderOptions =
    ordersData?.items.map((order) => ({
      value: order.id,
      label: `${order.project_no || ''} - ${order.product_model || ''} - ${order.customer_model || ''}`.trim(),
      // 保存原始数据用于搜索
      project_no: order.project_no || '',
      product_model: order.product_model || '',
      customer_model: order.customer_model || '',
    })) || []

  // 工序选项
  const processOptions =
    processesData?.items.map((process) => ({
      value: process.id,
      label: process.process_name,
    })) || []

  // 操作者选项
  const operatorOptions =
    employeesData?.items.map((employee) => ({
      value: employee.id,
      label: employee.name,
    })) || []

  return (
    <Space.Compact style={{ width: '100%', maxWidth: 1200 }}>
      <RangePicker
        value={startDate && endDate ? [startDate, endDate] : null}
        onChange={handleDateRangeChange}
        format="YYYY-MM-DD"
        placeholder={['开始日期', '结束日期']}
        allowClear
      />
      <Select
        placeholder="选择订单"
        value={orderId}
        onChange={setOrderId}
        allowClear
        showSearch
        filterOption={(input, option) => {
          const searchText = input.toLowerCase()
          const label = (option?.label ?? '').toLowerCase()
          const projectNo = (option?.project_no ?? '').toLowerCase()
          const productModel = (option?.product_model ?? '').toLowerCase()
          const customerModel = (option?.customer_model ?? '').toLowerCase()
          
          // 支持搜索项目号、产品型号、客户型号或完整标签
          return (
            label.includes(searchText) ||
            projectNo.includes(searchText) ||
            productModel.includes(searchText) ||
            customerModel.includes(searchText)
          )
        }}
        style={{ width: 200 }}
        options={orderOptions}
      />
      <Select
        placeholder="选择工序"
        value={processId}
        onChange={setProcessId}
        allowClear
        showSearch
        filterOption={(input, option) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
        }
        style={{ width: 150 }}
        options={processOptions}
      />
      <Input
        placeholder="输入型号搜索"
        value={productModel}
        onChange={(e) => setProductModel(e.target.value)}
        allowClear
        style={{ width: 180 }}
        onPressEnter={handleSearch}
      />
      <Select
        placeholder="选择操作者"
        value={operatorId}
        onChange={setOperatorId}
        allowClear
        showSearch
        filterOption={(input, option) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
        }
        style={{ width: 150 }}
        options={operatorOptions}
      />
      <Button type="primary" onClick={handleSearch}>
        搜索
      </Button>
      <Button onClick={handleReset}>重置</Button>
    </Space.Compact>
  )
}

