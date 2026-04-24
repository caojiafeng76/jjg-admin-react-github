import { useEffect, useState } from 'react'
import { DatePicker, Button, Form, Input, Select, Space } from 'antd'
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/16/solid'
import type { Dayjs } from 'dayjs'

import type { ProductionDailyReportFilters } from '@/services/apiProductionDailyReport'
import type { ProductionOrderDataCategory } from '@/services/apiProductionOrderItems'

const { RangePicker } = DatePicker

interface SearchFormValues {
  dateRange?: [Dayjs | null, Dayjs | null]
  dataCategory?: ProductionOrderDataCategory
  projectNo?: string
  productModel?: string
  customerModel?: string
  operation?: string
}

interface Props {
  initialValues: ProductionDailyReportFilters
  onSearch: (filters: ProductionDailyReportFilters) => void
  onReset: () => void
  mobile?: boolean
}

export default function ProductionDailyReportSearch({
  initialValues,
  onSearch,
  onReset,
  mobile = false,
}: Props) {
  const [form] = Form.useForm<SearchFormValues>()
  const [isSearching, setIsSearching] = useState(false)
  const [isExpanded, setIsExpanded] = useState(!mobile)

  useEffect(() => {
    form.setFieldsValue(initialValues)
  }, [form, initialValues])

  useEffect(() => {
    setIsExpanded(!mobile)
  }, [mobile])

  const handleFinish = (values: SearchFormValues) => {
    const filters: ProductionDailyReportFilters = {
      dataCategory: values.dataCategory,
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
    if (mobile) {
      setIsExpanded(false)
    }
    setTimeout(() => setIsSearching(false), 300)
  }

  const handleReset = () => {
    form.resetFields()
    setIsSearching(true)
    onReset()
    if (mobile) {
      setIsExpanded(false)
    }
    setTimeout(() => setIsSearching(false), 300)
  }

  const formContent = (
    <Form<SearchFormValues>
      form={form}
      onFinish={handleFinish}
      layout={mobile ? 'vertical' : 'inline'}
      initialValues={initialValues}
      className={
        mobile ? 'grid grid-cols-1 gap-3' : 'flex flex-wrap items-center gap-2'
      }
    >
      <Form.Item name="dateRange" className="mb-0">
        <RangePicker
          format="YYYY-MM-DD"
          placeholder={['开始日期', '结束日期']}
          allowClear
        />
      </Form.Item>

      <Form.Item name="projectNo" className="mb-0">
        <Input
          allowClear
          placeholder="项目号"
          style={{ width: mobile ? '100%' : 140 }}
        />
      </Form.Item>

      {mobile ? null : (
        <Form.Item name="dataCategory" className="mb-0">
          <Select
            allowClear
            placeholder="数据类别"
            style={{ width: 140 }}
            options={[
              { label: 'A', value: 'A' },
              { label: 'B', value: 'B' },
            ]}
          />
        </Form.Item>
      )}

      <Form.Item name="productModel" className="mb-0">
        <Input
          allowClear
          placeholder="型号"
          style={{ width: mobile ? '100%' : 160 }}
        />
      </Form.Item>

      <Form.Item name="customerModel" className="mb-0">
        <Input
          allowClear
          placeholder="客户型号"
          style={{ width: mobile ? '100%' : 160 }}
        />
      </Form.Item>

      <Form.Item name="operation" className="mb-0">
        <Input
          allowClear
          placeholder="工序"
          style={{ width: mobile ? '100%' : 140 }}
        />
      </Form.Item>

      <Form.Item className="mb-0">
        <Space className={mobile ? 'flex w-full [&_.ant-btn]:flex-1' : ''}>
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

  if (mobile) {
    return (
      <div className="flex flex-col gap-3">
        <Button
          block
          type="default"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="h-11 rounded-2xl border-slate-200 bg-slate-50 px-4 text-slate-700 shadow-none"
        >
          <span className="flex w-full items-center justify-between text-sm font-medium">
            <span>{isExpanded ? '收起筛选条件' : '展开筛选条件'}</span>
            <ChevronDownIcon
              className={
                isExpanded
                  ? 'h-4 w-4 rotate-180 transition-transform'
                  : 'h-4 w-4 transition-transform'
              }
            />
          </span>
        </Button>

        {isExpanded ? (
          <div className="max-h-[calc(100dvh-340px)] overflow-y-auto overscroll-contain pr-1 pb-1">
            {formContent}
          </div>
        ) : null}
      </div>
    )
  }

  return formContent
}
