import { useEffect, useState } from 'react'
import { DatePicker, Button, Form, Input, Space, Select } from 'antd'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/16/solid'
import dayjs, { type Dayjs } from 'dayjs'

const { RangePicker } = DatePicker

interface SearchParams {
  startDate?: string
  endDate?: string
  employeeId?: string
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

  useEffect(() => {
    form.setFieldsValue({
      employeeId: fixedEmployee?.id || initialValues?.employeeId,
      dateRange:
        initialValues?.startDate && initialValues?.endDate
          ? [dayjs(initialValues.startDate), dayjs(initialValues.endDate)]
          : undefined,
    })
  }, [fixedEmployee, form, initialValues])

  const handleSearch = (values: {
    dateRange?: [Dayjs | null, Dayjs | null]
    employeeId?: string
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

    setIsSearching(true)
    onSearch(params)
    setTimeout(() => setIsSearching(false), 300)
  }

  const handleReset = () => {
    form.resetFields()
    if (fixedEmployee?.id) {
      form.setFieldValue('employeeId', fixedEmployee.id)
    }
    setIsSearching(true)
    onReset()
    setTimeout(() => setIsSearching(false), 300)
  }

  return (
    <Form
      form={form}
      onFinish={handleSearch}
      layout={mobile ? 'vertical' : 'inline'}
      className={mobile ? 'grid grid-cols-1 gap-3' : 'flex flex-wrap items-center gap-2'}
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
          <Input value={fixedEmployee.name} disabled style={{ width: mobile ? '100%' : 160 }} />
        </Form.Item>
      ) : (
        <Form.Item name="employeeId" className="mb-0">
          <Select
            placeholder="选择操作人"
            allowClear
            style={{ width: mobile ? '100%' : 160 }}
            showSearch
            optionFilterProp="children"
            options={employees.map((emp) => ({ label: emp.name, value: emp.id }))}
          />
        </Form.Item>
      )}

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
}
