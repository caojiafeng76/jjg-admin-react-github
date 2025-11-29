import { useState } from 'react'
import { Input, DatePicker, Button, Form, Space } from 'antd'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/16/solid'
import dayjs, { Dayjs } from 'dayjs'

const { RangePicker } = DatePicker

interface SearchParams {
  project_no?: string
  product_model?: string
  customer_model?: string
  startDate?: string
  endDate?: string
}

interface Props {
  onSearch: (params: SearchParams) => void
  onReset: () => void
}

export default function WorkshopOrderSearch({ onSearch, onReset }: Props) {
  const [form] = Form.useForm()
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = (values: {
    project_no?: string
    product_model?: string
    customer_model?: string
    dateRange?: [Dayjs | null, Dayjs | null]
  }) => {
    const params: SearchParams = {}
    
    if (values.project_no?.trim()) {
      params.project_no = values.project_no.trim()
    }
    if (values.product_model?.trim()) {
      params.product_model = values.product_model.trim()
    }
    if (values.customer_model?.trim()) {
      params.customer_model = values.customer_model.trim()
    }
    if (values.dateRange && values.dateRange[0] && values.dateRange[1]) {
      params.startDate = values.dateRange[0].format('YYYY-MM-DD')
      params.endDate = values.dateRange[1].format('YYYY-MM-DD')
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
    <Form form={form} onFinish={handleSearch} layout="inline" className="flex flex-wrap items-center gap-2">
      <Form.Item name="project_no" className="mb-0">
        <Input
          placeholder="项目号"
          allowClear
          style={{ width: 150 }}
        />
      </Form.Item>
      <Form.Item name="product_model" className="mb-0">
        <Input
          placeholder="产品型号"
          allowClear
          style={{ width: 150 }}
        />
      </Form.Item>
      <Form.Item name="customer_model" className="mb-0">
        <Input
          placeholder="客户型号"
          allowClear
          style={{ width: 200 }}
        />
      </Form.Item>
      <Form.Item name="dateRange" className="mb-0">
        <RangePicker
          format="YYYY-MM-DD"
          placeholder={['开始日期', '结束日期']}
          allowClear
          style={{ width: 240 }}
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

