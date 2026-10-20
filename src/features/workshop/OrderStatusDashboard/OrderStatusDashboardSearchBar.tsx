import type { SearchValues } from './dashboardUtils'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/16/solid'
import { Button, DatePicker, Input, Select, Typography } from 'antd'
import dayjs from 'dayjs'
import { PRODUCTION_STATUS_OPTIONS } from './dashboardUtils'

const { Text } = Typography

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

export function OrderStatusDashboardSearchBar({
  isSearching,
  onReset,
  onSearch,
  onUpdateValue,
  searchValues,
}: OrderStatusDashboardSearchBarProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 shadow-sm backdrop-blur-sm transition-all duration-200 hover:shadow-md hover:shadow-slate-200/50 dark:border-slate-700/50 dark:bg-slate-800/80 dark:hover:shadow-none">
      {/* 搜索表单（不换行：窄屏横向滚动，恒为一行高度） */}
      <div className="p-2.5">
        <div className="flex items-center gap-x-6 overflow-x-auto [&>*]:shrink-0">
          {/* 交货日期 */}
          <div className="group flex items-center gap-2.5">
            <Text
              type="secondary"
              className="!text-xs font-medium text-slate-400 dark:text-slate-500"
            >
              交货日期
            </Text>
            <DatePicker
              allowClear
              format="YYYY-MM-DD"
              placeholder="交货日期"
              value={
                searchValues.orderDate ? dayjs(searchValues.orderDate) : null
              }
              onChange={date =>
                onUpdateValue(
                  'orderDate',
                  date ? date.format('YYYY-MM-DD') : '',
                )}
              className="!w-36 !rounded-lg !border-slate-200/80 !bg-slate-50/50 transition-all duration-200 hover:!border-slate-300 hover:!bg-white focus:!border-blue-400 focus:!bg-white dark:!border-slate-600/70 dark:!bg-slate-900/60 dark:hover:!border-slate-500 dark:hover:!bg-slate-800/80 dark:focus:!border-blue-500 dark:focus:!bg-slate-800/80"
            />
          </div>

          {/* 项目号 */}
          <div className="group flex items-center gap-2.5">
            <Text
              type="secondary"
              className="!text-xs font-medium text-slate-400 dark:text-slate-500"
            >
              项目号
            </Text>
            <Input
              allowClear
              placeholder="项目号"
              value={searchValues.projectNo}
              onChange={event =>
                onUpdateValue('projectNo', event.target.value)}
              onPressEnter={onSearch}
              className="!w-44 !rounded-lg !border-slate-200/80 !bg-slate-50/50 transition-all duration-200 hover:!border-slate-300 hover:!bg-white focus:!border-blue-400 focus:!bg-white dark:!border-slate-600/70 dark:!bg-slate-900/60 dark:hover:!border-slate-500 dark:hover:!bg-slate-800/80 dark:focus:!border-blue-500 dark:focus:!bg-slate-800/80"
            />
          </div>

          {/* 客户 */}
          <div className="group flex items-center gap-2.5">
            <Text
              type="secondary"
              className="!text-xs font-medium text-slate-400 dark:text-slate-500"
            >
              客户
            </Text>
            <Input
              allowClear
              placeholder="客户"
              value={searchValues.customer}
              onChange={event =>
                onUpdateValue('customer', event.target.value)}
              onPressEnter={onSearch}
              className="!w-32 !rounded-lg !border-slate-200/80 !bg-slate-50/50 transition-all duration-200 hover:!border-slate-300 hover:!bg-white focus:!border-blue-400 focus:!bg-white dark:!border-slate-600/70 dark:!bg-slate-900/60 dark:hover:!border-slate-500 dark:hover:!bg-slate-800/80 dark:focus:!border-blue-500 dark:focus:!bg-slate-800/80"
            />
          </div>

          {/* 型号 */}
          <div className="group flex items-center gap-2.5">
            <Text
              type="secondary"
              className="!text-xs font-medium text-slate-400 dark:text-slate-500"
            >
              型号
            </Text>
            <Input
              allowClear
              placeholder="型号"
              value={searchValues.model}
              onChange={event => onUpdateValue('model', event.target.value)}
              onPressEnter={onSearch}
              className="!w-32 !rounded-lg !border-slate-200/80 !bg-slate-50/50 transition-all duration-200 hover:!border-slate-300 hover:!bg-white focus:!border-blue-400 focus:!bg-white dark:!border-slate-600/70 dark:!bg-slate-900/60 dark:hover:!border-slate-500 dark:hover:!bg-slate-800/80 dark:focus:!border-blue-500 dark:focus:!bg-slate-800/80"
            />
          </div>

          {/* 料号 */}
          <div className="group flex items-center gap-2.5">
            <Text
              type="secondary"
              className="!text-xs font-medium text-slate-400 dark:text-slate-500"
            >
              料号
            </Text>
            <Input
              allowClear
              placeholder="料号"
              value={searchValues.materialCode}
              onChange={event =>
                onUpdateValue('materialCode', event.target.value)}
              onPressEnter={onSearch}
              className="!w-36 !rounded-lg !border-slate-200/80 !bg-slate-50/50 transition-all duration-200 hover:!border-slate-300 hover:!bg-white focus:!border-blue-400 focus:!bg-white dark:!border-slate-600/70 dark:!bg-slate-900/60 dark:hover:!border-slate-500 dark:hover:!bg-slate-800/80 dark:focus:!border-blue-500 dark:focus:!bg-slate-800/80"
            />
          </div>

          {/* 状态 */}
          <div className="group flex items-center gap-2.5">
            <Text
              type="secondary"
              className="!text-xs font-medium text-slate-400 dark:text-slate-500"
            >
              状态
            </Text>
            <Select
              allowClear
              placeholder="生产状态"
              value={searchValues.productionStatus || undefined}
              options={PRODUCTION_STATUS_OPTIONS}
              onChange={value =>
                onUpdateValue('productionStatus', value ?? '')}
              className="!w-32 [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!border-slate-200/80 [&_.ant-select-selector]:!bg-slate-50/50 dark:[&_.ant-select-selector]:!border-slate-600/70 dark:[&_.ant-select-selector]:!bg-slate-900/60"
            />
          </div>

          {/* 操作按钮 */}
          <div className="ml-auto flex items-center gap-2">
            <Button
              type="primary"
              icon={<MagnifyingGlassIcon className="size-4" />}
              loading={isSearching}
              onClick={onSearch}
              className="!rounded-lg !bg-gradient-to-r !from-blue-500 !to-indigo-500 !shadow-md !shadow-blue-500/30 !transition-all !duration-200 hover:!from-blue-600 hover:!to-indigo-600 hover:!shadow-lg hover:!shadow-blue-500/40 active:!scale-95 active:!transform"
            >
              搜索
            </Button>
            <Button
              icon={<XMarkIcon className="size-4" />}
              onClick={onReset}
              className="!rounded-lg !border-slate-200/80 !bg-white/80 !text-slate-500 !shadow-sm !transition-all !duration-200 hover:!border-slate-300 hover:!bg-slate-50 hover:!text-slate-600 dark:!border-slate-600/70 dark:!bg-slate-800/80 dark:!text-slate-400 dark:hover:!border-slate-500 dark:hover:!bg-slate-700 dark:hover:!text-slate-200"
            >
              重置
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
