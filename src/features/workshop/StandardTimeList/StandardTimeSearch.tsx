import { Button, DatePicker, Form, Input, Space } from 'antd'
import { useEffect } from 'react'
import dayjs, { type Dayjs } from 'dayjs'

const { RangePicker } = DatePicker

interface SearchValues {
  operation?: string
  model?: string
  updatedAtRange?: [Dayjs | null, Dayjs | null]
}

interface Props {
  onSearch: (params: {
    operation?: string
    model?: string
    updatedStartDate?: string
    updatedEndDate?: string
  }) => void
  onReset: () => void
  mobile?: boolean
  initialValues?: {
    operation?: string
    model?: string
    updatedStartDate?: string
    updatedEndDate?: string
  }
}

export default function StandardTimeSearch({
  onSearch,
  onReset,
  mobile = false,
  initialValues,
}: Props) {
  const [form] = Form.useForm<SearchValues>()

  useEffect(() => {
    form.setFieldsValue({
      operation: initialValues?.operation,
      model: initialValues?.model,
      updatedAtRange:
        initialValues?.updatedStartDate && initialValues?.updatedEndDate
          ? [
              dayjs(initialValues.updatedStartDate),
              dayjs(initialValues.updatedEndDate),
            ]
          : undefined,
    })
  }, [form, initialValues])

  const handleSearch = (values: SearchValues) => {
    onSearch({
      operation: values.operation?.trim() || undefined,
      model: values.model?.trim() || undefined,
      updatedStartDate:
        values.updatedAtRange?.[0]?.format('YYYY-MM-DD') || undefined,
      updatedEndDate:
        values.updatedAtRange?.[1]?.format('YYYY-MM-DD') || undefined,
    })
  }

  const handleReset = () => {
    form.resetFields()
    onReset()
  }

  return (
    <Form
      form={form}
      onFinish={handleSearch}
      className={
        mobile ? 'grid grid-cols-1 gap-3' : 'flex flex-1 flex-wrap gap-2'
      }
    >
      <Form.Item
        name="operation"
        className="mb-0"
        style={{ width: mobile ? '100%' : 240 }}
      >
        <Input
          placeholder="请输入工序"
          onPressEnter={() => form.submit()}
          allowClear
        />
      </Form.Item>
      <Form.Item
        name="model"
        className="mb-0"
        style={{ width: mobile ? '100%' : 240 }}
      >
        <Input
          placeholder="请输入型号"
          onPressEnter={() => form.submit()}
          allowClear
        />
      </Form.Item>
      <Form.Item
        name="updatedAtRange"
        className="mb-0"
        style={{ width: mobile ? '100%' : 280 }}
      >
        <RangePicker
          format="YYYY-MM-DD"
          placeholder={['更新开始日期', '更新结束日期']}
          allowClear
        />
      </Form.Item>
      <Form.Item className="mb-0">
        <Space className={mobile ? 'flex w-full [&_.ant-btn]:flex-1' : ''}>
          <Button type="primary" htmlType="submit">
            搜索
          </Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </Form.Item>
    </Form>
  )
}
