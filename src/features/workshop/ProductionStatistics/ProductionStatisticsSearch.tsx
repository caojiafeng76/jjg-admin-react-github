import { useEffect, useState } from 'react'
import { Button, DatePicker, Input, Select, Space } from 'antd'
import { useQuery } from '@tanstack/react-query'
import dayjs, { type Dayjs } from 'dayjs'

import { getEmployees } from '@/services/apiEmployees'

const { RangePicker } = DatePicker

interface Props {
  onSearch: (params: {
    startDate?: string
    endDate?: string
    project_no?: string
    product_model?: string
    operator_id?: string
  }) => void
  onReset: () => void
  initialStartDate?: string
  initialEndDate?: string
}

export default function ProductionStatisticsSearch({
  onSearch,
  onReset,
  initialStartDate,
  initialEndDate,
}: Props) {
  const [startDate, setStartDate] = useState<Dayjs | null>(
    initialStartDate ? dayjs(initialStartDate) : dayjs().startOf('month'),
  )
  const [endDate, setEndDate] = useState<Dayjs | null>(
    initialEndDate ? dayjs(initialEndDate) : dayjs().endOf('month'),
  )
  const [projectNo, setProjectNo] = useState('')
  const [productModel, setProductModel] = useState('')
  const [operatorId, setOperatorId] = useState<string | undefined>(undefined)

  const { data: employeesData } = useQuery({
    queryKey: ['employees', 1, 1000],
    queryFn: () => getEmployees({ page: 1, pageSize: 1000 }),
  })

  const operatorOptions =
    employeesData?.items.map((employee) => ({
      value: employee.id,
      label: employee.name,
    })) || []

  const handleSearch = () => {
    onSearch({
      startDate: startDate ? startDate.format('YYYY-MM-DD') : undefined,
      endDate: endDate ? endDate.format('YYYY-MM-DD') : undefined,
      project_no: projectNo.trim() || undefined,
      product_model: productModel.trim() || undefined,
      operator_id: operatorId,
    })
  }

  const handleReset = () => {
    const start = dayjs().startOf('month')
    const end = dayjs().endOf('month')
    setStartDate(start)
    setEndDate(end)
    setProjectNo('')
    setProductModel('')
    setOperatorId(undefined)
    onReset()
  }

  useEffect(() => {
    if (initialStartDate && initialEndDate) {
      setStartDate(dayjs(initialStartDate))
      setEndDate(dayjs(initialEndDate))
    }
  }, [initialStartDate, initialEndDate])

  return (
    <Space.Compact style={{ width: '100%', maxWidth: 1200 }}>
      <RangePicker
        value={startDate && endDate ? [startDate, endDate] : null}
        onChange={(dates) => {
          if (dates) {
            setStartDate(dates[0])
            setEndDate(dates[1])
          } else {
            setStartDate(null)
            setEndDate(null)
          }
        }}
        format="YYYY-MM-DD"
        placeholder={['开始日期', '结束日期']}
        allowClear
      />
      <Input
        placeholder="项目号"
        value={projectNo}
        onChange={(e) => setProjectNo(e.target.value)}
        allowClear
        style={{ width: 160 }}
        onPressEnter={handleSearch}
      />
      <Input
        placeholder="产品型号/客户型号"
        value={productModel}
        onChange={(e) => setProductModel(e.target.value)}
        allowClear
        style={{ width: 200 }}
        onPressEnter={handleSearch}
      />
      <Select
        placeholder="选择操作人"
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

