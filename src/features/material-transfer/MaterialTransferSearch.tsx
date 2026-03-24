import { useEffect, useState } from 'react'
import { Button, DatePicker, Form, Input, Select, Space } from 'antd'
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/16/solid'
import dayjs, { type Dayjs } from 'dayjs'

import {
  MATERIAL_TRANSFER_AUDIT_OPTIONS,
  MATERIAL_TRANSFER_WORKSHOPS,
  type MaterialTransferFilters,
} from '@/services/apiMaterialTransfers'

const { RangePicker } = DatePicker

interface MaterialTransferSearchValues extends MaterialTransferFilters {
  dateRange?: [Dayjs | null, Dayjs | null]
}

interface Props {
  onSearch: (values: MaterialTransferSearchValues) => void
  onReset: () => void
  employees: { id: string; name: string }[]
  initialValues?: MaterialTransferSearchValues
  mobile?: boolean
  showEmployeeFilter?: boolean
}

export default function MaterialTransferSearch({
  onSearch,
  onReset,
  employees,
  initialValues,
  mobile = false,
  showEmployeeFilter = true,
}: Props) {
  const [form] = Form.useForm()
  const [isExpanded, setIsExpanded] = useState(!mobile)

  useEffect(() => {
    form.setFieldsValue({
      ...initialValues,
      dateRange:
        initialValues?.startDate && initialValues?.endDate
          ? [dayjs(initialValues.startDate), dayjs(initialValues.endDate)]
          : undefined,
    })
  }, [form, initialValues])

  useEffect(() => {
    setIsExpanded(!mobile)
  }, [mobile])

  function handleFinish(values: MaterialTransferSearchValues) {
    onSearch({
      startDate:
        values.dateRange?.[0] && values.dateRange?.[1]
          ? values.dateRange[0].format('YYYY-MM-DD')
          : undefined,
      endDate:
        values.dateRange?.[0] && values.dateRange?.[1]
          ? values.dateRange[1].format('YYYY-MM-DD')
          : undefined,
      projectNo: values.projectNo?.trim() || undefined,
      employeeId: values.employeeId || undefined,
      targetWorkshop: values.targetWorkshop || undefined,
      recipientName: values.recipientName?.trim() || undefined,
      isAudited:
        typeof values.isAudited === 'boolean' ? values.isAudited : undefined,
    })
  }

  function handleReset() {
    form.resetFields()
    onReset()
    if (mobile) {
      setIsExpanded(false)
    }
  }

  const formContent = (
    <Form
      form={form}
      onFinish={handleFinish}
      layout={mobile ? 'vertical' : 'inline'}
      className={
        mobile ? 'grid grid-cols-1 gap-3' : 'flex flex-wrap items-center gap-2'
      }
    >
      <Form.Item name="dateRange" className="mb-0">
        <RangePicker
          format="YYYY-MM-DD"
          placeholder={['创建开始日期', '创建结束日期']}
          allowClear
          style={{ width: mobile ? '100%' : 260 }}
        />
      </Form.Item>

      <Form.Item name="projectNo" className="mb-0">
        <Input
          placeholder="项目号"
          allowClear
          style={{ width: mobile ? '100%' : 180 }}
        />
      </Form.Item>

      {showEmployeeFilter ? (
        <Form.Item name="employeeId" className="mb-0">
          <Select
            placeholder="操作人"
            allowClear
            showSearch
            optionFilterProp="label"
            style={{ width: mobile ? '100%' : 180 }}
            options={employees.map((employee) => ({
              label: employee.name,
              value: employee.id,
            }))}
          />
        </Form.Item>
      ) : null}

      <Form.Item name="targetWorkshop" className="mb-0">
        <Select
          placeholder="接收车间"
          allowClear
          style={{ width: mobile ? '100%' : 180 }}
          options={MATERIAL_TRANSFER_WORKSHOPS.map((workshop) => ({
            label: workshop,
            value: workshop,
          }))}
        />
      </Form.Item>

      <Form.Item name="recipientName" className="mb-0">
        <Input
          placeholder="接收人"
          allowClear
          style={{ width: mobile ? '100%' : 160 }}
        />
      </Form.Item>

      <Form.Item name="isAudited" className="mb-0">
        <Select
          placeholder="审核状态"
          allowClear
          style={{ width: mobile ? '100%' : 140 }}
          options={[...MATERIAL_TRANSFER_AUDIT_OPTIONS]}
        />
      </Form.Item>

      <Form.Item className="mb-0">
        <Space className={mobile ? 'flex w-full [&_.ant-btn]:flex-1' : ''}>
          <Button
            type="primary"
            icon={<MagnifyingGlassIcon className="h-4 w-4" />}
            htmlType="submit"
          >
            搜索
          </Button>
          <Button
            icon={<XMarkIcon className="h-4 w-4" />}
            onClick={handleReset}
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
