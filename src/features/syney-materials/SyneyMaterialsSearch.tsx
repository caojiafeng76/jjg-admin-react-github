import type { SyneyMaterialsSearchFilters } from '@/services/syneyMaterialsSearchFields'
import { Form, Input } from 'antd'
import { useEffect } from 'react'

import { SYNEY_MATERIALS_SEARCH_FIELDS } from '@/services/syneyMaterialsSearchFields'
import FilterBar, { FilterBarActions } from '@/ui/FilterBar'

export interface SyneyMaterialsSearchProps {
  values: SyneyMaterialsSearchFilters
  onSearch: (values: SyneyMaterialsSearchFilters) => void
  onReset: () => void
}

/** 西尼材料列表页筛选栏：品名、规格，条件之间为 AND */
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
    <FilterBar>
      <Form
        form={form}
        onFinish={handleFinish}
        className="flex flex-1 flex-wrap items-center gap-2"
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
          <FilterBarActions onReset={handleReset} />
        </Form.Item>
      </Form>
    </FilterBar>
  )
}
