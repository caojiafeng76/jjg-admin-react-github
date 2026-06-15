import { useEffect, useState } from 'react'
import { DatePicker, Button, Form, Input, Space, Select } from 'antd'
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/16/solid'
import dayjs, { type Dayjs } from 'dayjs'

import type { ProductionOrderShift } from '@/services/apiProductionOrders'
import type { ProductionOrderDataCategory } from '@/services/apiProductionOrderItems'

const { RangePicker } = DatePicker

interface SearchParams {
  startDate?: string
  endDate?: string
  employeeId?: string
  shift?: ProductionOrderShift
  dataCategory?: ProductionOrderDataCategory
  productModel?: string
  customerModel?: string
  isAudited?: boolean
}

interface Props {
  onSearch: (params: SearchParams) => void
  onReset: () => void
  employees: { id: string; name: string }[]
  initialValues?: SearchParams
  fixedEmployee?: { id: string; name: string } | null
  mobile?: boolean
}

export default function ProductionOrderSearch({
  onSearch,
  onReset,
  employees,
  initialValues,
  fixedEmployee,
  mobile = false,
}: Props) {
  const [form] = Form.useForm()
  const [isSearching, setIsSearching] = useState(false)
  const [isExpanded, setIsExpanded] = useState(!mobile)

  useEffect(() => {
    form.setFieldsValue({
      employeeId: fixedEmployee?.id || initialValues?.employeeId,
      shift: initialValues?.shift,
      dataCategory: initialValues?.dataCategory,
      productModel: initialValues?.productModel,
      customerModel: initialValues?.customerModel,
      isAudited: initialValues?.isAudited,
      dateRange:
        initialValues?.startDate && initialValues?.endDate
          ? [dayjs(initialValues.startDate), dayjs(initialValues.endDate)]
          : undefined,
    })
  }, [fixedEmployee, form, initialValues])

  useEffect(() => {
    setIsExpanded(!mobile)
  }, [mobile])

  const handleSearch = (values: {
    dateRange?: [Dayjs | null, Dayjs | null]
    employeeId?: string
    shift?: ProductionOrderShift
    dataCategory?: ProductionOrderDataCategory
    productModel?: string
    customerModel?: string
    isAudited?: boolean
  }) => {
    const params: SearchParams = {}

    if (values.dateRange && values.dateRange[0] && values.dateRange[1]) {
      params.startDate = values.dateRange[0].format('YYYY-MM-DD')
      params.endDate = values.dateRange[1].format('YYYY-MM-DD')
    }

    if (fixedEmployee?.id) {
      params.employeeId = fixedEmployee.id
    } else if (values.employeeId) {
      params.employeeId = values.employeeId
    }

    if (values.shift) {
      params.shift = values.shift
    }

    if (values.dataCategory) {
      params.dataCategory = values.dataCategory
    }

    const productModel = values.productModel?.trim()
    if (productModel) {
      params.productModel = productModel
    }

    const customerModel = values.customerModel?.trim()
    if (customerModel) {
      params.customerModel = customerModel
    }

    if (typeof values.isAudited === 'boolean') {
      params.isAudited = values.isAudited
    }

    setIsSearching(true)
    onSearch(params)
    if (mobile) {
      setIsExpanded(false)
    }
    setTimeout(() => setIsSearching(false), 300)
  }

  const handleReset = () => {
    form.resetFields()
    if (fixedEmployee?.id) {
      form.setFieldValue('employeeId', fixedEmployee.id)
    }
    setIsSearching(true)
    onReset()
    if (mobile) {
      setIsExpanded(false)
    }
    setTimeout(() => setIsSearching(false), 300)
  }

  const formContent = (
    <Form
      form={form}
      onFinish={handleSearch}
      layout={mobile ? 'vertical' : 'inline'}
      className={
        mobile ? 'grid grid-cols-1 gap-3' : 'flex flex-wrap items-end gap-2'
      }
    >
      <Form.Item name="dateRange" className="mb-0">
        <RangePicker
          format="YYYY-MM-DD"
          placeholder={['开始日期', '结束日期']}
          allowClear
          style={{ width: mobile ? '100%' : 240 }}
          className="rounded-lg"
        />
      </Form.Item>
      {fixedEmployee ? (
        <Form.Item className="mb-0">
          <Input
            value={fixedEmployee.name}
            disabled
            style={{ width: mobile ? '100%' : 160 }}
            className="rounded-lg bg-slate-50"
            prefix={
              <span className="mr-1 text-xs text-slate-400">操作人</span>
            }
          />
        </Form.Item>
      ) : (
        <Form.Item name="employeeId" className="mb-0">
          <Select
            placeholder="选择操作人"
            allowClear
            style={{ width: mobile ? '100%' : 160 }}
            showSearch
            optionFilterProp="label"
            className="rounded-lg"
            options={employees.map((emp) => ({
              label: emp.name,
              value: emp.id,
            }))}
          />
        </Form.Item>
      )}

      <Form.Item name="productModel" className="mb-0">
        <Input
          placeholder="型号"
          allowClear
          style={{ width: mobile ? '100%' : 140 }}
          className="rounded-lg"
        />
      </Form.Item>

      {mobile ? null : (
        <Form.Item name="dataCategory" className="mb-0">
          <Select
            placeholder="数据类别"
            allowClear
            style={{ width: 120 }}
            className="rounded-lg"
            options={[
              { label: 'A', value: 'A' },
              { label: 'B', value: 'B' },
            ]}
          />
        </Form.Item>
      )}

      <Form.Item name="shift" className="mb-0">
        <Select
          placeholder="班别"
          allowClear
          style={{ width: mobile ? '100%' : 120 }}
          className="rounded-lg"
          options={[
            { label: '白班', value: '白班' },
            { label: '夜班', value: '夜班' },
          ]}
        />
      </Form.Item>

      <Form.Item name="customerModel" className="mb-0">
        <Input
          placeholder="客户型号"
          allowClear
          style={{ width: mobile ? '100%' : 150 }}
          className="rounded-lg"
        />
      </Form.Item>

      <Form.Item name="isAudited" className="mb-0">
        <Select
          placeholder="审核状态"
          allowClear
          style={{ width: mobile ? '100%' : 120 }}
          className="rounded-lg"
          options={[
            { label: '已审核', value: true },
            { label: '待审核', value: false },
          ]}
        />
      </Form.Item>

      <Form.Item className="mb-0">
        <Space className={mobile ? 'flex w-full [&_.ant-btn]:flex-1' : 'gap-2'}>
          <Button
            type="primary"
            icon={<MagnifyingGlassIcon className="h-4 w-4" />}
            htmlType="submit"
            loading={isSearching}
            className="h-9 rounded-lg !bg-gradient-to-r from-blue-500 to-blue-600 px-5 shadow-md transition-all duration-200 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
            搜索
          </Button>
          <Button
            icon={<XMarkIcon className="h-4 w-4" />}
            onClick={handleReset}
            disabled={isSearching}
            className="h-9 rounded-lg border-slate-200 bg-white px-5 text-slate-600 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 active:bg-slate-100"
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
          className="h-11 rounded-2xl border-slate-200 bg-white px-4 text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
        >
          <span className="flex w-full items-center justify-between text-sm font-medium">
            <span className="flex items-center gap-2">
              <AdjustmentsHorizontalIcon className="h-4 w-4 text-slate-400" />
              {isExpanded ? '收起筛选条件' : '展开筛选条件'}
            </span>
            <ChevronDownIcon
              className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${
                isExpanded ? '-rotate-180' : ''
              }`}
            />
          </span>
        </Button>

        <div
          className={`overflow-hidden transition-all duration-300 ${
            isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="flex flex-col gap-3">
            {formContent}
          </div>
        </div>
      </div>
    )
  }

  return formContent
}
