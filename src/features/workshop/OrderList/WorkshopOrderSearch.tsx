import { useState } from 'react'
import { DatePicker, Button, Form, Input, Space, Select } from 'antd'
import type { Dayjs } from 'dayjs'

const { RangePicker } = DatePicker

interface SearchParams {
  project_no?: string
  product_model?: string
  customer_model?: string
  project_no_search?: string | string[] // 多关键词搜索项目号
  model_search?: string | string[] // 多关键词搜索产品型号、客户型号
  length_mm?: number[]
  startDate?: string
  endDate?: string
}

interface Props {
  onSearch: (params: SearchParams) => void
  onReset: () => void
  lengthOptions: number[]
}

export default function WorkshopOrderSearch({
  onSearch,
  onReset,
  lengthOptions,
}: Props) {
  const [form] = Form.useForm()
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = (values: {
    project_no_search?: string
    model_search?: string
    length_mm?: number[]
    dateRange?: [Dayjs | null, Dayjs | null]
  }) => {
    const params: SearchParams = {}

    const projectNoSearch = values.project_no_search?.trim()
    const modelSearch = values.model_search?.trim()

    if (projectNoSearch) {
      params.project_no_search = projectNoSearch
    }

    if (modelSearch) {
      params.model_search = modelSearch
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
      className="flex flex-wrap items-center gap-3"
    >
      <Form.Item name="project_no_search" className="mb-0">
        <Input
          placeholder="项目号"
          allowClear
          onPressEnter={() => form.submit()}
          className="rounded-md border-slate-200 bg-white/80 shadow-sm transition-all hover:border-blue-300 hover:shadow-md focus:border-blue-400 focus:shadow-md dark:border-slate-600 dark:bg-slate-700/50 dark:hover:border-blue-500"
          style={{ width: 180 }}
        />
      </Form.Item>
      <Form.Item name="model_search" className="mb-0">
        <Input
          placeholder="型号"
          allowClear
          onPressEnter={() => form.submit()}
          className="rounded-md border-slate-200 bg-white/80 shadow-sm transition-all hover:border-blue-300 hover:shadow-md focus:border-blue-400 focus:shadow-md dark:border-slate-600 dark:bg-slate-700/50 dark:hover:border-blue-500"
          style={{ width: 180 }}
        />
      </Form.Item>
      <Form.Item name="dateRange" className="mb-0">
        <RangePicker
          format="YYYY-MM-DD"
          placeholder={['开始日期', '结束日期']}
          allowClear
          className="rounded-md border-slate-200 bg-white/80 shadow-sm transition-all hover:border-blue-300 focus-within:border-blue-400 dark:border-slate-600 dark:bg-slate-700/50"
          style={{ width: 220 }}
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
          className="min-w-[160px]"
          options={lengthOptions.map((length) => ({
            label: `${length}`,
            value: length,
          }))}
          styles={{
            popup: {
              root: {
                minWidth: 160,
              },
            },
          }}
        />
      </Form.Item>
      <Form.Item className="mb-0">
        <Space>
          <Button
            type="primary"
            icon={
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            }
            htmlType="submit"
            loading={isSearching}
            className="shadow-sm transition-all hover:shadow-md"
          >
            搜索
          </Button>
          <Button
            icon={
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            }
            onClick={handleReset}
            disabled={isSearching}
            className="shadow-sm transition-all hover:shadow-md"
          >
            重置
          </Button>
        </Space>
      </Form.Item>
    </Form>
  )
}
