import { useState } from 'react'
import { DatePicker, Button, Form, Space, Select } from 'antd'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/16/solid'
import type { Dayjs } from 'dayjs'

const { RangePicker } = DatePicker

interface SearchParams {
  startDate?: string
  endDate?: string
  employeeId?: string
  status?: string
}

interface Props {
  onSearch: (params: SearchParams) => void
  onReset: () => void
  employees: { id: string; name: string }[]
}

export default function ProductionOrderSearch({
  onSearch,
  onReset,
  employees,
}: Props) {
  const [form] = Form.useForm()
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = (values: {
    dateRange?: [Dayjs | null, Dayjs | null]
    employeeId?: string
    status?: string
  }) => {
    const params: SearchParams = {}

    if (values.dateRange && values.dateRange[0] && values.dateRange[1]) {
      params.startDate = values.dateRange[0].format('YYYY-MM-DD')
      params.endDate = values.dateRange[1].format('YYYY-MM-DD')
    }

    if (values.employeeId) {
      params.employeeId = values.employeeId
    }

    if (values.status) {
      params.status = values.status
    }

    setIsSearching(true)
    onSearch(params)
    setTimeout(() => setIsSearching(false), 300)
  }

  const handleReset = () => {
    form.resetFields()
    setIsSearching(true)
    onReset()
    setTimeout(() => setIsSearching(false), 300)
  }

  return (
    <Form
      form={form}
      onFinish={handleSearch}
      layout="inline"
      className="flex flex-wrap items-center gap-2"
    >
      <Form.Item name="dateRange" className="mb-0">
        <RangePicker
          format="YYYY-MM-DD"
          placeholder={['开始日期', '结束日期']}
          allowClear
          style={{ width: 240 }}
        />
      </Form.Item>
      <Form.Item name="employeeId" className="mb-0">
        <Select
          placeholder="选择操作人"
          allowClear
          style={{ width: 160 }}
          showSearch
          optionFilterProp="children"
          options={employees.map((emp) => ({ label: emp.name, value: emp.id }))}
        />
      </Form.Item>
      <Form.Item name="status" className="mb-0">
        <Select
          placeholder="选择状态"
          allowClear
          style={{ width: 120 }}
          options={[
            { label: '进行中', value: '进行中' },
            { label: '已完成', value: '已完成' },
            { label: '已取消', value: '已取消' },
          ]}
        />
      </Form.Item>
      <Form.Item className="mb-0">
        <Space>
          <Button
            type="primary"
            icon={<MagnifyingGlassIcon className="h-4 w-4" />}
            htmlType="submit"
            loading={isSearching}
          >
            搜索
          </Button>
          <Button
            icon={<XMarkIcon className="h-4 w-4" />}
            onClick={handleReset}
            disabled={isSearching}
          >
            重置
          </Button>
        </Space>
      </Form.Item>
    </Form>
  )
}
