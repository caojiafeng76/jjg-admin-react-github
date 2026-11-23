import type { UrlListFilters } from '@/hooks/useUrlListState'
import { Form, Select } from 'antd'
import { useEffect } from 'react'

import { FilterBarActions } from '@/ui/FilterBar'
import { FILTER_INPUT_WIDTH_CLASSES } from '@/ui/filterBarTokens'

export type ReportSearchFilters = UrlListFilters<'status'>

export interface ReportSearchProps {
  values: ReportSearchFilters
  onSearch: (values: ReportSearchFilters) => void
  onReset: () => void
  isLoading?: boolean
}

const STATUS_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'unconfirmed', label: '未校对' },
  { value: 'confirmed', label: '已校对' },
]

/** 西尼入库对账单列表筛选表单 */
export default function ReportSearch({
  values,
  onSearch,
  onReset,
  isLoading = false,
}: ReportSearchProps) {
  const [form] = Form.useForm<ReportSearchFilters>()

  useEffect(() => {
    form.setFieldsValue({
      status: values.status || 'all',
    })
  }, [form, values.status])

  function handleFinish(formValues: ReportSearchFilters) {
    const status = formValues.status?.trim()
    onSearch({
      status: status && status !== 'all' ? status : undefined,
    })
  }

  function handleReset() {
    form.resetFields()
    form.setFieldsValue({ status: 'all' })
    onReset()
  }

  return (
    <Form
      form={form}
      onFinish={handleFinish}
      className="flex flex-1 flex-wrap items-center gap-2"
    >
      <Form.Item name="status" label="对账状态" className="mb-0!">
        <Select
          aria-label="对账状态"
          options={STATUS_OPTIONS}
          className={FILTER_INPUT_WIDTH_CLASSES.short}
          getPopupContainer={() => document.body}
        />
      </Form.Item>
      <Form.Item className="mb-0!">
        <FilterBarActions onReset={handleReset} isLoading={isLoading} />
      </Form.Item>
    </Form>
  )
}
