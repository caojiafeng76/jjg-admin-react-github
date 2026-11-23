import type { UrlListFilters } from '@/hooks/useUrlListState'
import { Form, Input } from 'antd'
import { useEffect } from 'react'

import { FilterBarActions } from '@/ui/FilterBar'
import { FILTER_INPUT_WIDTH_CLASSES } from '@/ui/filterBarTokens'

export type SafePartSearchFilters = UrlListFilters<'partNo'>

export interface SafePartSearchProps {
  values: SafePartSearchFilters
  onSearch: (values: SafePartSearchFilters) => void
  onReset: () => void
  isLoading?: boolean
}

/** 件号配置列表筛选表单（前端按件号包含匹配） */
export default function SafePartSearch({
  values,
  onSearch,
  onReset,
  isLoading = false,
}: SafePartSearchProps) {
  const [form] = Form.useForm<SafePartSearchFilters>()

  useEffect(() => {
    form.setFieldsValue({
      partNo: values.partNo,
    })
  }, [form, values.partNo])

  function handleFinish(formValues: SafePartSearchFilters) {
    onSearch({
      partNo: formValues.partNo?.trim() || undefined,
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
      <Form.Item name="partNo" label="件号" className="mb-0!">
        <Input
          placeholder="搜索件号（前端过滤）"
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
