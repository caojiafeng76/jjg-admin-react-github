import type { FormInstance } from 'antd'
import type { SearchFormValues } from './productionSchedulingUtils'
import { ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/react/16/solid'

import { Button, DatePicker, Form, Input, Select } from 'antd'
import { WORKSHOP_ORDER_STATUS_OPTIONS } from '@/features/workshop/OrderList/orderStatus'
import {
  DEFAULT_FILTERS,

} from './productionSchedulingUtils'

export interface ProductionSchedulingSearchBarProps {
  form: FormInstance<SearchFormValues>
  lengthOptions: number[]
  onSearch: (values: SearchFormValues) => void
  onReset: () => void
}

export default function ProductionSchedulingSearchBar({
  form,
  lengthOptions,
  onSearch,
  onReset,
}: ProductionSchedulingSearchBarProps) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/60">
      <div className="p-1">
        <Form<SearchFormValues>
          form={form}
          layout="inline"
          initialValues={DEFAULT_FILTERS}
          onFinish={onSearch}
          className="flex flex-wrap items-center gap-x-3 gap-y-2"
        >
          <Form.Item
            name="projectNo"
            label={(
              <span className="!text-xs text-slate-500 dark:text-slate-400">
                项目号
              </span>
            )}
            className="!mb-0"
          >
            <Input
              size="small"
              allowClear
              placeholder="多关键词用空格分隔"
              className="!w-40"
            />
          </Form.Item>
          <Form.Item
            name="model"
            label={(
              <span className="!text-xs text-slate-500 dark:text-slate-400">
                型号
              </span>
            )}
            className="!mb-0"
          >
            <Input
              size="small"
              allowClear
              placeholder="产品/客户型号"
              className="!w-32"
            />
          </Form.Item>
          <Form.Item
            name="materialCode"
            label={(
              <span className="!text-xs text-slate-500 dark:text-slate-400">
                料号
              </span>
            )}
            className="!mb-0"
          >
            <Input
              size="small"
              allowClear
              placeholder="多关键词用空格分隔"
              className="!w-36"
            />
          </Form.Item>
          <Form.Item
            name="lengthMm"
            label={(
              <span className="!text-xs text-slate-500 dark:text-slate-400">
                长度
              </span>
            )}
            className="!mb-0"
          >
            <Select
              size="small"
              allowClear
              className="!w-36"
              maxTagCount="responsive"
              mode="multiple"
              options={lengthOptions.map(length => ({
                label: `${length}mm`,
                value: length,
              }))}
              placeholder="全部"
              showSearch={{ optionFilterProp: 'label' }}
            />
          </Form.Item>
          <Form.Item
            name="customer"
            label={(
              <span className="!text-xs text-slate-500 dark:text-slate-400">
                客户
              </span>
            )}
            className="!mb-0"
          >
            <Input size="small" allowClear className="!w-28" />
          </Form.Item>
          <Form.Item
            name="status"
            label={(
              <span className="!text-xs text-slate-500 dark:text-slate-400">
                状态
              </span>
            )}
            className="!mb-0"
          >
            <Select
              size="small"
              className="!w-24"
              options={[
                { label: '全部', value: '全部' },
                ...WORKSHOP_ORDER_STATUS_OPTIONS.map(item => ({
                  label: item.label,
                  value: item.value,
                })),
              ]}
            />
          </Form.Item>
          <Form.Item
            name="progressStatus"
            label={(
              <span className="!text-xs text-slate-500 dark:text-slate-400">
                进度
              </span>
            )}
            className="!mb-0"
          >
            <Select
              size="small"
              allowClear
              className="!w-24"
              placeholder="全部"
              options={[
                { label: '未开工', value: '未开工' },
                { label: '进行中', value: '进行中' },
                { label: '已完工', value: '已完工' },
                { label: '延期', value: '延期' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="plannedStartDateRange"
            label={(
              <span className="!text-xs text-slate-500 dark:text-slate-400">
                开工
              </span>
            )}
            className="!mb-0"
          >
            <DatePicker.RangePicker
              size="small"
              allowClear
              className="!w-44"
              placeholder={['开始', '结束']}
            />
          </Form.Item>
          <Form.Item
            name="orderDateRange"
            label={(
              <span className="!text-xs text-slate-500 dark:text-slate-400">
                日期
              </span>
            )}
            className="!mb-0"
          >
            <DatePicker.RangePicker
              size="small"
              format="YYYY-MM-DD"
              allowClear
              className="!w-44"
              placeholder={['开始', '结束']}
            />
          </Form.Item>
          <Form.Item className="!mb-0">
            <Button
              type="primary"
              size="small"
              htmlType="submit"
              icon={<MagnifyingGlassIcon className="size-4" />}
            >
              查询
            </Button>
          </Form.Item>
          <Form.Item className="!mb-0">
            <Button
              size="small"
              icon={<ArrowPathIcon className="size-4" />}
              onClick={onReset}
            >
              重置
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}
