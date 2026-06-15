import { Button, DatePicker, Form, Input, Space } from 'antd'
import type { RangePickerProps } from 'antd/es/date-picker'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { UserIcon } from '@heroicons/react/24/outline'

const { RangePicker } = DatePicker

interface SearchValues {
  name?: string
  dateRange?: [dayjs.Dayjs, dayjs.Dayjs] | null
}

interface Props {
  onSearch: (params: {
    name?: string
    startDate?: string
    endDate?: string
  }) => void
  onReset: () => void
  initialValues?: { name?: string; startDate?: string; endDate?: string }
}

export default function AttendanceStatsSearch({
  onSearch,
  onReset,
  initialValues,
}: Props) {
  const [form] = Form.useForm<SearchValues>()

  useEffect(() => {
    form.setFieldsValue({
      name: initialValues?.name,
      dateRange:
        initialValues?.startDate && initialValues?.endDate
          ? ([dayjs(initialValues.startDate), dayjs(initialValues.endDate)] as [
              dayjs.Dayjs,
              dayjs.Dayjs,
            ])
          : undefined,
    })
  }, [form, initialValues])

  const handleSearch = (values: SearchValues) => {
    onSearch({
      name: values.name?.trim() || undefined,
      startDate: values.dateRange?.[0]?.format('YYYY-MM-DD') || undefined,
      endDate: values.dateRange?.[1]?.format('YYYY-MM-DD') || undefined,
    })
  }

  const handleReset = () => {
    form.resetFields()
    onReset()
  }

  const disabledDate: RangePickerProps['disabledDate'] = (current) =>
    current && current > dayjs().endOf('day')

  return (
    <Form
      form={form}
      onFinish={handleSearch}
      className="flex flex-wrap items-center gap-3"
    >
      <Form.Item name="name" className="!mb-0" style={{ width: 200 }}>
        <Input
          prefix={<UserIcon className="mr-1 h-4 w-4 text-slate-400" />}
          placeholder="输入员工姓名"
          allowClear
          onPressEnter={() => form.submit()}
          className="rounded-lg"
        />
      </Form.Item>
      <Form.Item name="dateRange" className="!mb-0">
        <RangePicker
          disabledDate={disabledDate}
          placeholder={['开始日期', '结束日期']}
          allowClear
          className="rounded-lg"
        />
      </Form.Item>
      <Form.Item className="!mb-0">
        <Space>
          <Button
            type="primary"
            htmlType="submit"
            className="rounded-lg"
          >
            查询
          </Button>
          <Button
            onClick={handleReset}
            className="rounded-lg"
          >
            重置
          </Button>
        </Space>
      </Form.Item>
    </Form>
  )
}
