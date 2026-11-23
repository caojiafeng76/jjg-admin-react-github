import type { SearchValues } from './dashboardUtils'
import { DatePicker, Input, Select } from 'antd'
import dayjs from 'dayjs'
import { useId } from 'react'
import FilterBar, { FilterBarActions } from '@/ui/FilterBar'
import { PRODUCTION_STATUS_OPTIONS } from './dashboardUtils'

export interface OrderStatusDashboardSearchBarProps {
  isSearching: boolean
  onReset: () => void
  onSearch: () => void
  onUpdateValue: <TKey extends keyof SearchValues>(
    key: TKey,
    value: SearchValues[TKey],
  ) => void
  searchValues: SearchValues
}

const TEXT_FILTERS = [
  { key: 'projectNo', label: '项目号', width: 160 },
  { key: 'customer', label: '客户', width: 128 },
  { key: 'model', label: '型号', width: 128 },
  { key: 'materialCode', label: '料号', width: 144 },
] as const

export function OrderStatusDashboardSearchBar({
  isSearching,
  onReset,
  onSearch,
  onUpdateValue,
  searchValues,
}: OrderStatusDashboardSearchBarProps) {
  const id = useId()

  return (
    <FilterBar className="shrink-0">
      <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
        <div className="flex items-center gap-2">
          <label htmlFor={`${id}-orderDate`}>交货日期</label>
          <DatePicker
            id={`${id}-orderDate`}
            allowClear
            format="YYYY-MM-DD"
            placeholder="交货日期"
            value={searchValues.orderDate ? dayjs(searchValues.orderDate) : null}
            onChange={date => onUpdateValue('orderDate', date ? date.format('YYYY-MM-DD') : '')}
            style={{ width: 144 }}
          />
        </div>

        {TEXT_FILTERS.map(({ key, label, width }) => (
          <div key={key} className="flex items-center gap-2">
            <label htmlFor={`${id}-${key}`}>{label}</label>
            <Input
              id={`${id}-${key}`}
              allowClear
              placeholder={label}
              value={searchValues[key]}
              onChange={event => onUpdateValue(key, event.target.value)}
              onPressEnter={onSearch}
              style={{ width }}
            />
          </div>
        ))}

        <div className="flex items-center gap-2">
          <label htmlFor={`${id}-productionStatus`}>状态</label>
          <Select
            id={`${id}-productionStatus`}
            allowClear
            placeholder="生产状态"
            value={searchValues.productionStatus || undefined}
            options={PRODUCTION_STATUS_OPTIONS}
            onChange={value => onUpdateValue('productionStatus', value ?? '')}
            style={{ width: 128 }}
          />
        </div>

        <FilterBarActions
          className="ml-auto flex items-center gap-2"
          isLoading={isSearching}
          onSearch={onSearch}
          onReset={onReset}
        />
      </div>
    </FilterBar>
  )
}
