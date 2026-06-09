import { useEffect } from 'react'
import { Button, DatePicker, Form, Input, Select, Space } from 'antd'
import {
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/16/solid'
import dayjs, { type Dayjs } from 'dayjs'

import type { ExtrusionProductionFilters } from '@/services/apiExtrusionProductions'

const { RangePicker } = DatePicker

interface ExtrusionProductionSearchValues extends ExtrusionProductionFilters {
  dateRange?: [Dayjs | null, Dayjs | null]
}

interface Props {
  onSearch: (values: ExtrusionProductionFilters) => void
  onReset: () => void
  initialValues?: ExtrusionProductionSearchValues
}

const SHIFT_OPTIONS = [
  { label: '白班', value: '白班' },
  { label: '夜班', value: '夜班' },
]

const AUDIT_OPTIONS = [
  { label: '已审核', value: true },
  { label: '待审核', value: false },
]

export default function ExtrusionProductionSearch({
  onSearch,
  onReset,
  initialValues,
}: Props) {
  const [form] = Form.useForm<ExtrusionProductionSearchValues>()

  useEffect(() => {
    form.setFieldsValue({
      ...initialValues,
      dateRange:
        initialValues?.startDate && initialValues?.endDate
          ? [dayjs(initialValues.startDate), dayjs(initialValues.endDate)]
          : undefined,
    })
  }, [form, initialValues])

  function handleFinish(values: ExtrusionProductionSearchValues) {
    onSearch({
      startDate:
        values.dateRange?.[0] && values.dateRange?.[1]
          ? values.dateRange[0].format('YYYY-MM-DD')
          : undefined,
      endDate:
        values.dateRange?.[0] && values.dateRange?.[1]
          ? values.dateRange[1].format('YYYY-MM-DD')
          : undefined,
      shift: values.shift || undefined,
      machineId: values.machineId?.trim() || undefined,
      operatorEmployeeId: values.operatorEmployeeId?.trim() || undefined,
      projectNo: values.projectNo?.trim() || undefined,
      isAudited:
        typeof values.isAudited === 'boolean' ? values.isAudited : undefined,
    })
  }

  function handleReset() {
    form.resetFields()
    onReset()
  }

  return (
    <Form
      form={form}
      onFinish={handleFinish}
      layout="inline"
      className="flex flex-wrap items-center gap-2"
    >
      <Form.Item name="dateRange" className="mb-0">
        <RangePicker
          format="YYYY-MM-DD"
          placeholder={['生产开始日期', '生产结束日期']}
          allowClear
        />
      </Form.Item>

      <Form.Item name="projectNo" className="mb-0">
        <Input placeholder="项目号" allowClear style={{ width: 180 }} />
      </Form.Item>

      <Form.Item name="shift" className="mb-0">
        <Select
          placeholder="班别"
          allowClear
          style={{ width: 120 }}
          options={SHIFT_OPTIONS}
        />
      </Form.Item>

      <Form.Item name="machineId" className="mb-0">
        <Input placeholder="设备ID" allowClear style={{ width: 180 }} />
      </Form.Item>

      <Form.Item name="operatorEmployeeId" className="mb-0">
        <Input placeholder="操作人员工ID" allowClear style={{ width: 180 }} />
      </Form.Item>

      <Form.Item name="isAudited" className="mb-0">
        <Select
          placeholder="审核状态"
          allowClear
          style={{ width: 140 }}
          options={AUDIT_OPTIONS}
        />
      </Form.Item>

      <Form.Item className="mb-0">
        <Space>
          <Button
            type="primary"
            icon={<MagnifyingGlassIcon className="h-4 w-4" />}
            htmlType="submit"
          >
            搜索
          </Button>
          <Button icon={<XMarkIcon className="h-4 w-4" />} onClick={handleReset}>
            重置
          </Button>
        </Space>
      </Form.Item>
    </Form>
  )
}
