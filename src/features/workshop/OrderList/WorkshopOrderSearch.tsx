import { useState } from 'react'
import { DatePicker, Button, Form, Space, Select } from 'antd'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/16/solid'
import type { Dayjs } from 'dayjs'

const { RangePicker } = DatePicker

interface SearchParams {
  project_no?: string
  product_model?: string
  customer_model?: string
  project_no_search?: string[] // 多关键词搜索项目号
  model_search?: string[] // 多关键词搜索产品型号、客户型号
  length_mm?: number[]
  startDate?: string
  endDate?: string
}

interface Props {
  onSearch: (params: SearchParams) => void
  onReset: () => void
  lengthOptions: number[]
  projectNoOptions: string[]
  modelOptions: string[]
}

export default function WorkshopOrderSearch({
  onSearch,
  onReset,
  lengthOptions,
  projectNoOptions,
  modelOptions,
}: Props) {
  const [form] = Form.useForm()
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = (values: {
    project_no_search?: string[]
    model_search?: string[]
    length_mm?: number[]
    dateRange?: [Dayjs | null, Dayjs | null]
  }) => {
    const params: SearchParams = {}

    if (values.project_no_search?.length) {
      params.project_no_search = values.project_no_search
    }

    if (values.model_search?.length) {
      params.model_search = values.model_search
    }

    if (values.length_mm?.length) {
      params.length_mm = Array.from(new Set(values.length_mm)).sort(
        (left, right) => left - right,
      )
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
    <Form
      form={form}
      onFinish={handleSearch}
      layout="inline"
      className="flex flex-wrap items-center gap-2"
    >
      <Form.Item name="project_no_search" className="mb-0">
        <Select
          placeholder="项目号"
          mode="multiple"
          allowClear
          showSearch
          filterOption={(input, option) =>
            String(option?.label || '')
              .toLowerCase()
              .includes(input.toLowerCase())
          }
          style={{ width: 200 }}
          options={projectNoOptions.map((v) => ({ label: v, value: v }))}
        />
      </Form.Item>
      <Form.Item name="model_search" className="mb-0">
        <Select
          placeholder="型号"
          mode="multiple"
          allowClear
          showSearch
          filterOption={(input, option) =>
            String(option?.label || '')
              .toLowerCase()
              .includes(input.toLowerCase())
          }
          style={{ width: 200 }}
          options={modelOptions.map((v) => ({ label: v, value: v }))}
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
      <Form.Item name="length_mm" className="mb-0">
        <Select
          placeholder="长度(mm)"
          mode="multiple"
          allowClear
          showSearch={{
            filterOption: (input, option) =>
              String(option?.label || '').includes(input),
          }}
          style={{ width: 220 }}
          options={lengthOptions.map((length) => ({
            label: `${length}`,
            value: length,
          }))}
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
