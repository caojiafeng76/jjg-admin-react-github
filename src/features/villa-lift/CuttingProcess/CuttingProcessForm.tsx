import { useEffect, useState } from 'react'
import {
  Button,
  Form,
  FormInstance,
  Input,
  InputNumber,
  Select,
  Spin,
} from 'antd'
import { PlusCircleIcon, XMarkIcon } from '@heroicons/react/16/solid'

import type {
  VillaLiftCuttingBatchFormValues,
  VillaLiftCuttingRecordFormValues,
  VillaLiftOrderSelectOption,
} from '@/services/apiVillaLiftCutting'
import type { VillaLiftOrderItem } from '@/services/apiVillaLiftOrders'
import { useVillaLiftOrderItems } from '@features/villa-lift/OrderList/useVillaLiftOrders'

// ----------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------

/**
 * 合并选择器：型号 / 名称 / 规格 一次选完
 * 作为 Form.Item name='model' 的受控子组件，value/onChange 由 Form.Item 注入
 */
function CombinedItemSelect({
  value,
  onChange,
  fieldName,
  orderItems,
  disabled,
}: {
  value?: string
  onChange?: (model: string) => void
  fieldName: number
  orderItems: VillaLiftOrderItem[]
  disabled: boolean
}) {
  const form = Form.useFormInstance()
  const name = Form.useWatch(['rows', fieldName, 'name'])
  const spec = Form.useWatch(['rows', fieldName, 'spec'])

  // 当前选中的复合 key（与 option.value 对齐）
  const compositeValue = value
    ? `${value}|${name ?? ''}|${spec ?? ''}`
    : undefined

  // 去重后的选项列表
  const seen = new Set<string>()
  const options = orderItems
    .filter((item) => {
      const key = `${item.model}|${item.name}|${item.spec}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map((item) => ({
      value: `${item.model}|${item.name}|${item.spec}`,
      label: (
        <span className="flex gap-2 text-sm">
          <span className="font-medium">{item.model}</span>
          <span className="text-gray-600 dark:text-gray-300">{item.name}</span>
          <span className="text-gray-400">{item.spec}</span>
        </span>
      ),
      search: `${item.model} ${item.name} ${item.spec}`,
    }))

  function handleChange(val: string | undefined) {
    if (!val) {
      onChange?.('')
      form.setFieldValue(['rows', fieldName, 'name'], '')
      form.setFieldValue(['rows', fieldName, 'spec'], '')
      return
    }
    const [m = '', n = '', s = ''] = val.split('|')
    onChange?.(m)
    form.setFieldValue(['rows', fieldName, 'name'], n)
    form.setFieldValue(['rows', fieldName, 'spec'], s)
  }

  return (
    <Select
      showSearch
      allowClear
      value={compositeValue}
      options={options}
      onChange={handleChange}
      placeholder="选择型号 / 名称 / 规格"
      filterOption={(input, opt) =>
        (opt?.search ?? '').toLowerCase().includes(input.toLowerCase())
      }
      disabled={disabled}
      style={{ width: '100%' }}
    />
  )
}

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

interface CuttingProcessFormProps {
  orders: VillaLiftOrderSelectOption[]
  onFinish: (values: VillaLiftCuttingBatchFormValues) => Promise<void>
  setFormRef: (form: FormInstance<VillaLiftCuttingBatchFormValues>) => void
}

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------

const DEFAULT_ROW: VillaLiftCuttingRecordFormValues = {
  model: '',
  name: '',
  spec: '',
  operator: '',
  cut_quantity: 0,
  raw_scrap_quantity: 0,
  process_scrap_quantity: 0,
  remarks: '',
}

export default function CuttingProcessForm({
  orders,
  onFinish,
  setFormRef,
}: CuttingProcessFormProps) {
  const [form] = Form.useForm<VillaLiftCuttingBatchFormValues>()
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>()

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  // 获取选中订单的型号列表
  const { data: orderItems = [], isFetching: loadingItems } =
    useVillaLiftOrderItems(selectedOrderId ?? null)

  const orderOptions = orders.map((o) => ({
    value: o.id,
    label: `${o.project_name}`,
    order: o,
  }))

  function handleOrderChange(value: string) {
    setSelectedOrderId(value)
    // 清空所有行的型号和规格
    const rows: VillaLiftCuttingRecordFormValues[] =
      form.getFieldValue('rows') ?? []
    form.setFieldValue(
      'rows',
      rows.map((r) => ({ ...r, model: '', name: '', spec: '' })),
    )
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{ rows: [{ ...DEFAULT_ROW }] }}
    >
      {/* 订单选择 */}
      <Form.Item
        name="order_id"
        label="选择项目"
        rules={[{ required: true, message: '请选择项目' }]}
      >
        <Select
          showSearch
          placeholder="搜索项目名称 / 客户 / 产品"
          onChange={handleOrderChange}
          optionFilterProp="search"
          options={orderOptions.map((opt) => ({
            value: opt.value,
            label: (
              <span className="flex flex-wrap items-center gap-x-3 gap-y-0">
                <span className="font-medium">{opt.order.project_name}</span>
                <span className="text-xs text-gray-400">
                  {opt.order.customer} · {opt.order.product_name}
                  {opt.order.color ? ` · ${opt.order.color}` : ''} · 数量{' '}
                  {opt.order.quantity}
                </span>
              </span>
            ),
            search: `${opt.order.project_name} ${opt.order.customer} ${opt.order.product_name}`,
          }))}
        />
      </Form.Item>

      {/* 操作人（整批共用） */}
      <Form.Item
        name="operator"
        label="操作人"
        rules={[{ required: true, message: '请输入操作人' }]}
      >
        <Input placeholder="操作人姓名" />
      </Form.Item>

      {/* 切割明细行 */}
      <Form.List
        name="rows"
        rules={[
          {
            validator: async (_, rows) => {
              if (!rows || rows.length === 0)
                return Promise.reject(new Error('请至少添加一条切割记录'))
            },
          },
        ]}
      >
        {(fields, { add, remove }, { errors }) => {
          type FieldType = (typeof fields)[number]

          const columns = [
            {
              title: (
                <span>
                  型号 / 名称 / 规格 <span className="text-red-500">*</span>
                </span>
              ),
              key: 'item',
              render: (_: unknown, field: FieldType) => (
                <>
                  <Form.Item
                    name={[field.name, 'model']}
                    rules={[{ required: true, message: '请选择物料' }]}
                    className="mb-0"
                  >
                    <CombinedItemSelect
                      fieldName={field.name}
                      orderItems={orderItems}
                      disabled={!selectedOrderId}
                    />
                  </Form.Item>
                  {/* 隐藏锚点：让 name/spec 参与表单提交，无需 UI */}
                  <Form.Item name={[field.name, 'name']} hidden noStyle>
                    <Input />
                  </Form.Item>
                  <Form.Item name={[field.name, 'spec']} hidden noStyle>
                    <Input />
                  </Form.Item>
                </>
              ),
            },
            {
              title: (
                <span>
                  切割数量 <span className="text-red-500">*</span>
                </span>
              ),
              key: 'cut_quantity',
              render: (_: unknown, field: FieldType) => (
                <Form.Item
                  name={[field.name, 'cut_quantity']}
                  rules={[{ required: true, message: '请输入' }]}
                  className="mb-0"
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    placeholder="0"
                  />
                </Form.Item>
              ),
            },
            {
              title: '原料报废',
              key: 'raw_scrap_quantity',
              render: (_: unknown, field: FieldType) => (
                <Form.Item
                  name={[field.name, 'raw_scrap_quantity']}
                  className="mb-0"
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    placeholder="0"
                  />
                </Form.Item>
              ),
            },
            {
              title: '加工报废',
              key: 'process_scrap_quantity',
              render: (_: unknown, field: FieldType) => (
                <Form.Item
                  name={[field.name, 'process_scrap_quantity']}
                  className="mb-0"
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    placeholder="0"
                  />
                </Form.Item>
              ),
            },
            {
              title: '备注',
              key: 'remarks',
              render: (_: unknown, field: FieldType) => (
                <Form.Item name={[field.name, 'remarks']} className="mb-0">
                  <Input placeholder="备注" />
                </Form.Item>
              ),
            },
            {
              title: '',
              key: 'action',
              width: 36,
              render: (_: unknown, field: FieldType) => (
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<XMarkIcon className="size-4" />}
                  aria-label={`删除切割明细 ${field.name + 1}`}
                  onClick={() => remove(field.name)}
                  disabled={fields.length <= 1}
                />
              ),
            },
          ]

          return (
            <div>
              {loadingItems && selectedOrderId && (
                <div className="mb-2 flex items-center gap-2 text-sm text-gray-400">
                  <Spin size="small" /> 加载型号中…
                </div>
              )}

              {/* 表头 */}
              <div className="mb-1 grid grid-cols-[3fr_1fr_1fr_1fr_1.5fr_36px] gap-x-2 px-0 text-sm text-gray-500">
                {columns.map((col) => (
                  <div key={String(col.key)}>{col.title}</div>
                ))}
              </div>

              {/* 行 */}
              {fields.map((field) => (
                <div
                  key={field.key}
                  className="mb-2 grid grid-cols-[3fr_1fr_1fr_1fr_1.5fr_36px] items-start gap-x-2"
                >
                  {columns.map((col) => (
                    <div key={String(col.key)}>
                      {col.render(undefined, field)}
                    </div>
                  ))}
                </div>
              ))}

              <Form.ErrorList errors={errors} />

              <Button
                type="dashed"
                block
                icon={<PlusCircleIcon className="size-4" />}
                onClick={() => add({ ...DEFAULT_ROW })}
                disabled={!selectedOrderId}
              >
                添加型号
              </Button>
            </div>
          )
        }}
      </Form.List>
    </Form>
  )
}
