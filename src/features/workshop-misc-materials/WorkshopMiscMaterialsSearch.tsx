import type { WorkshopMiscMaterialsSearchFilters } from '@/services/workshopMiscMaterialsSearchFields'
import { AutoComplete, Form, Input } from 'antd'
import { useEffect, useMemo } from 'react'

import { WORKSHOP_MISC_MATERIALS_SEARCH_FIELDS } from '@/services/workshopMiscMaterialsSearchFields'
import FilterBar, { FilterBarActions } from '@/ui/FilterBar'
import { FILTER_INPUT_WIDTH_CLASSES } from '@/ui/filterBarTokens'
import { useWorkshopMiscMaterialsCategories } from './useWorkshopMiscMaterialsCategories'

export interface WorkshopMiscMaterialsSearchProps {
  values: WorkshopMiscMaterialsSearchFilters
  onSearch: (values: WorkshopMiscMaterialsSearchFilters) => void
  onReset: () => void
}

/** 车间杂项材料列表页筛选栏：型号、客户型号、规格、类别，条件之间为 AND */
export default function WorkshopMiscMaterialsSearch({
  values,
  onSearch,
  onReset,
}: WorkshopMiscMaterialsSearchProps) {
  const [form] = Form.useForm<WorkshopMiscMaterialsSearchFilters>()
  const { data: categories = [] } = useWorkshopMiscMaterialsCategories()

  const categoryOptions = useMemo(
    () => categories.map(category => ({ value: category, label: category })),
    [categories],
  )

  useEffect(() => {
    const next: WorkshopMiscMaterialsSearchFilters = {}
    for (const field of WORKSHOP_MISC_MATERIALS_SEARCH_FIELDS)
      next[field.key] = values[field.key]
    form.setFieldsValue(next)
  }, [form, values])

  const handleFinish = (formValues: WorkshopMiscMaterialsSearchFilters) => {
    const next: WorkshopMiscMaterialsSearchFilters = {}
    for (const field of WORKSHOP_MISC_MATERIALS_SEARCH_FIELDS)
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
        {WORKSHOP_MISC_MATERIALS_SEARCH_FIELDS.map(field => (
          <Form.Item
            key={field.key}
            name={field.key}
            className={`mb-0! ${FILTER_INPUT_WIDTH_CLASSES.short}`}
          >
            {field.key === 'category'
              ? (
                  <AutoComplete
                    options={categoryOptions}
                    placeholder={field.label}
                    aria-label={field.label}
                    allowClear
                    showSearch={{
                      filterOption: (inputValue, option) =>
                        String(option?.value ?? '')
                          .toLowerCase()
                          .includes(inputValue.trim().toLowerCase()),
                    }}
                  />
                )
              : (
                  <Input
                    placeholder={field.label}
                    aria-label={field.label}
                    allowClear
                    onPressEnter={() => form.submit()}
                  />
                )}
          </Form.Item>
        ))}
        <Form.Item className="mb-0!">
          <FilterBarActions onReset={handleReset} />
        </Form.Item>
      </Form>
    </FilterBar>
  )
}
