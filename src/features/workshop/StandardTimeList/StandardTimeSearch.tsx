import { Button, Checkbox, DatePicker, Form, Input, Space } from 'antd'
import { ChevronDownIcon } from '@heroicons/react/16/solid'
import { useEffect, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'

const { RangePicker } = DatePicker

interface SearchValues {
  operation?: string
  model?: string
  unmatchedOnly?: boolean
  updatedAtRange?: [Dayjs | null, Dayjs | null]
}

interface Props {
  onSearch: (params: {
    operation?: string
    model?: string
    unmatchedOnly?: boolean
    updatedStartDate?: string
    updatedEndDate?: string
  }) => void
  onReset: () => void
  mobile?: boolean
  initialValues?: {
    operation?: string
    model?: string
    unmatchedOnly?: boolean
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
  const [isExpanded, setIsExpanded] = useState(!mobile)

  useEffect(() => {
    form.setFieldsValue({
      operation: initialValues?.operation,
      model: initialValues?.model,
      unmatchedOnly: initialValues?.unmatchedOnly,
      updatedAtRange:
        initialValues?.updatedStartDate && initialValues?.updatedEndDate
          ? [
              dayjs(initialValues.updatedStartDate),
              dayjs(initialValues.updatedEndDate),
            ]
          : undefined,
    })
  }, [form, initialValues])

  useEffect(() => {
    setIsExpanded(!mobile)
  }, [mobile])

  const handleSearch = (values: SearchValues) => {
    onSearch({
      operation: values.operation?.trim() || undefined,
      model: values.model?.trim() || undefined,
      unmatchedOnly: values.unmatchedOnly || undefined,
      updatedStartDate:
        values.updatedAtRange?.[0]?.format('YYYY-MM-DD') || undefined,
      updatedEndDate:
        values.updatedAtRange?.[1]?.format('YYYY-MM-DD') || undefined,
    })

    if (mobile) {
      setIsExpanded(false)
    }
  }

  const handleReset = () => {
    form.resetFields()
    onReset()

    if (mobile) {
      setIsExpanded(false)
    }
  }

  const formContent = (
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
      <Form.Item
        name="unmatchedOnly"
        valuePropName="checked"
        className="mb-0 flex items-center"
      >
        <Checkbox>仅看未匹配工种</Checkbox>
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
          <div className="max-h-[calc(100dvh-340px)] overflow-y-auto overscroll-contain pb-1 pr-1">
            {formContent}
          </div>
        ) : null}
      </div>
    )
  }

  return formContent
}
