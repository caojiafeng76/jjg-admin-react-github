import { useEffect, useState } from 'react'
import { DatePicker, Button, Form, Input, Space } from 'antd'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/16/solid'
import type { Dayjs } from 'dayjs'

import type { ProductionDailyReportFilters } from '@/services/apiProductionDailyReport'

const { RangePicker } = DatePicker

interface SearchFormValues {
  dateRange?: [Dayjs | null, Dayjs | null]
  projectNo?: string
  productModel?: string
  customerModel?: string
  operation?: string
}

interface Props {
  initialValues: ProductionDailyReportFilters
  onSearch: (filters: ProductionDailyReportFilters) => void
  onReset: () => void
}

export default function ProductionDailyReportSearch({
  initialValues,
  onSearch,
  onReset,
}: Props) {
  const [form] = Form.useForm<SearchFormValues>()
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    form.setFieldsValue(initialValues)
  }, [form, initialValues])

  const handleFinish = (values: SearchFormValues) => {
    const filters: ProductionDailyReportFilters = {
      projectNo: values.projectNo?.trim() || undefined,
      productModel: values.productModel?.trim() || undefined,
      customerModel: values.customerModel?.trim() || undefined,
      operation: values.operation?.trim() || undefined,
    }

    if (values.dateRange?.[0] && values.dateRange?.[1]) {
      filters.startDate = values.dateRange[0].format('YYYY-MM-DD')
      filters.endDate = values.dateRange[1].format('YYYY-MM-DD')
    }

    setIsSearching(true)
    onSearch(filters)
    setTimeout(() => setIsSearching(false), 300)
  }

  const handleReset = () => {
    form.resetFields()
    setIsSearching(true)
    onReset()
    setTimeout(() => setIsSearching(false), 300)
  }

  return (
    <Form<SearchFormValues>
      form={form}
      onFinish={handleFinish}
      layout="inline"
      initialValues={initialValues}
      className="flex flex-wrap items-center gap-2"
    >
      <Form.Item name="dateRange" className="mb-0">
        <RangePicker
          format="YYYY-MM-DD"
          placeholder={['开始日期', '结束日期']}
          allowClear
        />
      </Form.Item>

      <Form.Item name="projectNo" className="mb-0">
        <Input allowClear placeholder="项目号" style={{ width: 140 }} />
      </Form.Item>

      <Form.Item name="productModel" className="mb-0">
        <Input allowClear placeholder="型号" style={{ width: 140 }} />
      </Form.Item>

      <Form.Item name="customerModel" className="mb-0">
        <Input allowClear placeholder="客户型号" style={{ width: 160 }} />
      </Form.Item>

      <Form.Item name="operation" className="mb-0">
        <Input allowClear placeholder="工序" style={{ width: 140 }} />
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
