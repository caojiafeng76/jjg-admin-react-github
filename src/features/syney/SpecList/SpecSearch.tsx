import type { UrlListFilters } from '@/hooks/useUrlListState'
import { Form, Input } from 'antd'
import { useEffect } from 'react'

import { FilterBarActions } from '@/ui/FilterBar'
import { FILTER_INPUT_WIDTH_CLASSES } from '@/ui/filterBarTokens'

export type SpecSearchFilters = UrlListFilters<'PartNo'>

export interface SpecSearchProps {
  values: SpecSearchFilters
  onSearch: (values: SpecSearchFilters) => void
  onReset: () => void
  isLoading?: boolean
}

/** 踏板规格列表筛选表单 */
export default function SpecSearch({
  values,
  onSearch,
  onReset,
  isLoading = false,
}: SpecSearchProps) {
  const [form] = Form.useForm<SpecSearchFilters>()

  useEffect(() => {
    form.setFieldsValue({
      PartNo: values.PartNo,
    })
  }, [form, values.PartNo])

  function handleFinish(formValues: SpecSearchFilters) {
    onSearch({
      PartNo: formValues.PartNo?.trim() || undefined,
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
      className="flex flex-1 flex-wrap items-center gap-2"
    >
      <Form.Item name="PartNo" label="件号" className="mb-0!">
        <Input
          placeholder="请输入件号"
          aria-label="件号"
          allowClear
          onPressEnter={() => form.submit()}
          className={FILTER_INPUT_WIDTH_CLASSES.medium}
        />
      </Form.Item>
      <Form.Item className="mb-0!">
        <FilterBarActions onReset={handleReset} isLoading={isLoading} />
      </Form.Item>
    </Form>
  )
}
