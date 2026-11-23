import type { Dayjs } from 'dayjs'
import type { UrlListFilters } from '@/hooks/useUrlListState'
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PauseCircleIcon,
  TruckIcon,
  XCircleIcon,
} from '@heroicons/react/16/solid'
import { DatePicker, Form, Input, Select } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'

import { FilterBarActions } from '@/ui/FilterBar'
import { FILTER_INPUT_WIDTH_CLASSES } from '@/ui/filterBarTokens'

const { RangePicker } = DatePicker

export type PoSearchUrlFilters = UrlListFilters<
  'Status' | 'startDate' | 'endDate' | 'SONo'
>

interface PoSearchFormValues {
  dateRange?: [Dayjs, Dayjs] | null
  Status?: string
  SONo?: string
}

export interface PoSearchProps {
  values: PoSearchUrlFilters
  onSearch: (values: PoSearchUrlFilters) => void
  onReset: () => void
  isLoading?: boolean
}

const STATUS_OPTIONS: Array<{
  value: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  colorClassName: string
}> = [
  { value: '全部', label: '全部', icon: CheckCircleIcon, colorClassName: 'text-slate-400 dark:text-slate-500' },
  { value: '已创建', label: '已创建', icon: XCircleIcon, colorClassName: 'text-error' },
  { value: '已入库', label: '已入库', icon: CheckCircleIcon, colorClassName: 'text-success' },
  { value: '部分送货', label: '部分送货', icon: ArrowPathIcon, colorClassName: 'text-primary' },
  { value: '已送货', label: '已送货', icon: TruckIcon, colorClassName: 'text-primary' },
  { value: '暂停', label: '暂停', icon: PauseCircleIcon, colorClassName: 'text-warning' },
  { value: '作废', label: '作废', icon: ExclamationTriangleIcon, colorClassName: 'text-slate-500 dark:text-slate-400' },
]

/** 西尼订单列表筛选表单（与 URL 参 Status/startDate/endDate/SONo 保持兼容） */
export default function PoSearch({
  values,
  onSearch,
  onReset,
  isLoading = false,
}: PoSearchProps) {
  const [form] = Form.useForm<PoSearchFormValues>()

  useEffect(() => {
    form.setFieldsValue({
      dateRange:
        values.startDate && values.endDate
          ? [dayjs(values.startDate), dayjs(values.endDate)]
          : null,
      Status: values.Status || '全部',
      SONo: values.SONo,
    })
  }, [form, values.SONo, values.Status, values.endDate, values.startDate])

  function handleFinish(formValues: PoSearchFormValues) {
    const [start, end] = formValues.dateRange ?? []
    const status = formValues.Status?.trim()
    onSearch({
      startDate: start ? start.format('YYYY-MM-DD') : undefined,
      endDate: end ? end.format('YYYY-MM-DD') : undefined,
      Status: status && status !== '全部' ? status : undefined,
      SONo: formValues.SONo?.trim() || undefined,
    })
  }

  function handleReset() {
    form.resetFields()
    form.setFieldsValue({ Status: '全部' })
    onReset()
  }

  return (
    <Form
      form={form}
      onFinish={handleFinish}
      className="flex flex-1 flex-wrap items-center gap-2"
    >
      <Form.Item name="dateRange" label="交货日期" className="mb-0!">
        <RangePicker
          format="YYYY-MM-DD"
          placeholder={['开始日期', '结束日期']}
          allowClear
          className={FILTER_INPUT_WIDTH_CLASSES.wide}
        />
      </Form.Item>

      <Form.Item name="Status" label="状态" className="mb-0!">
        <Select
          aria-label="订单状态"
          className={FILTER_INPUT_WIDTH_CLASSES.short}
          getPopupContainer={() => document.body}
          options={STATUS_OPTIONS.map(option => ({
            value: option.value,
            label: (
              <span className="inline-flex items-center gap-1.5">
                <option.icon className={`size-4 ${option.colorClassName}`} />
                <span>{option.label}</span>
              </span>
            ),
          }))}
        />
      </Form.Item>

      <Form.Item name="SONo" label="单号" className="mb-0!">
        <Input
          placeholder="搜索订单号/生产号"
          aria-label="订单号或生产号"
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
