import { useEffect, useState } from 'react'
import { DatePicker, Button, Form, Input, Space, Select } from 'antd'
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/16/solid'
import dayjs, { type Dayjs } from 'dayjs'

const { RangePicker } = DatePicker

interface SearchParams {
  startDate?: string
  endDate?: string
  employeeId?: string
  productModel?: string
  customerModel?: string
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
      productModel: initialValues?.productModel,
      customerModel: initialValues?.customerModel,
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
    productModel?: string
    customerModel?: string
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

    const productModel = values.productModel?.trim()
    if (productModel) {
      params.productModel = productModel
    }

    const customerModel = values.customerModel?.trim()
    if (customerModel) {
      params.customerModel = customerModel
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
        mobile ? 'grid grid-cols-1 gap-3' : 'flex flex-wrap items-center gap-2'
      }
    >
      <Form.Item name="dateRange" className="mb-0">
        <RangePicker
          format="YYYY-MM-DD"
          placeholder={['开始日期', '结束日期']}
          allowClear
          style={{ width: mobile ? '100%' : 240 }}
        />
      </Form.Item>
      {fixedEmployee ? (
        <Form.Item className="mb-0">
          <Input
            value={fixedEmployee.name}
            disabled
            style={{ width: mobile ? '100%' : 160 }}
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
          style={{ width: mobile ? '100%' : 160 }}
        />
      </Form.Item>

      <Form.Item name="customerModel" className="mb-0">
        <Input
          placeholder="客户型号"
          allowClear
          style={{ width: mobile ? '100%' : 180 }}
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

        {isExpanded ? formContent : null}
      </div>
    )
  }

  return formContent
}
