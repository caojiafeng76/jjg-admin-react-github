import type { SyneyMaterialsSearchFilters } from '@/services/syneyMaterialsSearchFields'
import { Button, Form, Input, Space } from 'antd'
import { useEffect } from 'react'

import { SYNEY_MATERIALS_SEARCH_FIELDS } from '@/services/syneyMaterialsSearchFields'

export interface SyneyMaterialsSearchProps {
  values: SyneyMaterialsSearchFilters
  onSearch: (values: SyneyMaterialsSearchFilters) => void
  onReset: () => void
}

/** 西尼材料列表页筛选卡片：品名、规格，条件之间为 AND */
export default function SyneyMaterialsSearch({
  values,
  onSearch,
  onReset,
}: SyneyMaterialsSearchProps) {
  const [form] = Form.useForm<SyneyMaterialsSearchFilters>()

  useEffect(() => {
    const next: SyneyMaterialsSearchFilters = {}
    for (const field of SYNEY_MATERIALS_SEARCH_FIELDS)
      next[field.key] = values[field.key]
    form.setFieldsValue(next)
  }, [form, values])

  const handleFinish = (formValues: SyneyMaterialsSearchFilters) => {
    const next: SyneyMaterialsSearchFilters = {}
    for (const field of SYNEY_MATERIALS_SEARCH_FIELDS)
      next[field.key] = formValues[field.key]?.trim() || undefined
    onSearch(next)
  }

  const handleReset = () => {
    form.resetFields()
    onReset()
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200/60 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center gap-2">
        <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500" />
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
          筛选条件
        </span>
      </div>
      <Form
        form={form}
        onFinish={handleFinish}
        className="flex flex-1 flex-wrap items-center gap-3"
      >
        {SYNEY_MATERIALS_SEARCH_FIELDS.map(field => (
          <Form.Item
            key={field.key}
            name={field.key}
            className="mb-0"
            style={{ width: 160 }}
          >
            <Input
              placeholder={field.label}
              aria-label={field.label}
              allowClear
              onPressEnter={() => form.submit()}
              className="rounded-lg"
            />
          </Form.Item>
        ))}
        <Form.Item className="mb-0">
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              className="rounded-lg font-medium shadow-sm"
            >
              搜索
            </Button>
            <Button onClick={handleReset} className="rounded-lg">
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  )
}
