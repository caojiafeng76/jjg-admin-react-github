import { Button, Checkbox, DatePicker, Form, Input, Select, Space } from 'antd'
import { ChevronDownIcon } from '@heroicons/react/16/solid'
import { useEffect, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'

import type { ProcessStandardRecordType } from '@/services/apiStandardTimes'

const { RangePicker } = DatePicker

interface SearchValues {
  operation?: string
  model?: string
  unmatchedOnly?: boolean
  partNoOnly?: boolean
  updatedAtRange?: [Dayjs | null, Dayjs | null]
  recordType?: ProcessStandardRecordType
}

interface Props {
  onSearch: (params: {
    operation?: string
    model?: string
    unmatchedOnly?: boolean
    partNoOnly?: boolean
    updatedStartDate?: string
    updatedEndDate?: string
    recordType?: ProcessStandardRecordType
  }) => void
  onReset: () => void
  mobile?: boolean
  initialValues?: {
    operation?: string
    model?: string
    unmatchedOnly?: boolean
    partNoOnly?: boolean
    updatedStartDate?: string
    updatedEndDate?: string
    recordType?: ProcessStandardRecordType
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
      partNoOnly: initialValues?.partNoOnly,
      recordType: initialValues?.recordType,
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
      partNoOnly: values.partNoOnly || undefined,
      recordType: values.recordType || undefined,
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
        mobile ? 'grid grid-cols-1 gap-3' : 'flex flex-1 flex-wrap items-center gap-3'
      }
    >
      <Form.Item
        name="operation"
        className="mb-0"
        style={{ width: mobile ? '100%' : 200 }}
      >
        <Input
          placeholder="输入工序搜索"
          onPressEnter={() => form.submit()}
          allowClear
          className="rounded-lg"
        />
      </Form.Item>
      <Form.Item
        name="model"
        className="mb-0"
        style={{ width: mobile ? '100%' : 200 }}
      >
        <Input
          placeholder="输入型号搜索"
          onPressEnter={() => form.submit()}
          allowClear
          className="rounded-lg"
        />
      </Form.Item>
      <Form.Item
        name="updatedAtRange"
        className="mb-0"
        style={{ width: mobile ? '100%' : 260 }}
      >
        <RangePicker
          format="YYYY-MM-DD"
          placeholder={['更新开始', '更新结束']}
          allowClear
          className="w-full rounded-lg"
        />
      </Form.Item>
      <Form.Item
        name="unmatchedOnly"
        valuePropName="checked"
        className="mb-0"
      >
        <Checkbox className="font-medium">仅看未匹配</Checkbox>
      </Form.Item>
      <Form.Item
        name="partNoOnly"
        valuePropName="checked"
        className="mb-0"
      >
        <Checkbox className="font-medium">仅匹配有料号</Checkbox>
      </Form.Item>
      {!mobile && (
        <Form.Item name="recordType" className="mb-0">
          <Select
            placeholder="类型"
            allowClear
            style={{ width: 140 }}
            className="rounded-lg"
            options={[
              { label: 'A类', value: 'A' },
              { label: 'B类', value: 'B' },
            ]}
          />
        </Form.Item>
      )}
      <Form.Item className="mb-0">
        <Space className={mobile ? 'flex w-full [&_.ant-btn]:flex-1' : ''}>
          <Button
            type="primary"
            htmlType="submit"
            className="rounded-lg font-medium shadow-sm"
          >
            搜索
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

  if (mobile) {
    return (
      <div className="flex flex-col gap-3">
        <Button
          block
          type="default"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="h-11 rounded-xl border-slate-200 bg-white px-4 text-sm font-medium shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
        >
          <span className="flex w-full items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span className="text-slate-600">筛选条件</span>
            </span>
            <ChevronDownIcon
              className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </span>
        </Button>

        {isExpanded ? (
          <div className="max-h-[calc(100dvh-340px)] overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            {formContent}
          </div>
        ) : null}
      </div>
    )
  }

  return formContent
}
