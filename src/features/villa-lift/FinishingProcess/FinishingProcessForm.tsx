import { useEffect, useMemo, useState } from 'react'
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
  VillaLiftFinishingBatchFormValues,
  VillaLiftFinishingRecordFormValues,
} from '@/services/apiVillaLiftFinishing'
import type { VillaLiftOrderSelectOption } from '@/services/apiVillaLiftCutting'
import type { VillaLiftOrderItem } from '@/services/apiVillaLiftOrders'
import { useVillaLiftOrderItems } from '@features/villa-lift/OrderList/useVillaLiftOrders'
import { useProcessOperationsByModels } from './useFinishingProcess'

// ----------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------

/**
 * 合并选择器：型号 / 名称 / 规格 一次选完
 * 同时，选中后将 name/spec 写入 form，并根据 operationsByModel 自动填写工序
 */
function CombinedItemSelect({
  value,
  onChange,
  fieldName,
  orderItems,
  disabled,
  operationsByModel,
}: {
  value?: string
  onChange?: (model: string) => void
  fieldName: number
  orderItems: VillaLiftOrderItem[]
  disabled: boolean
  operationsByModel: Map<string, string[]>
}) {
  const form = Form.useFormInstance()
  const name = Form.useWatch(['rows', fieldName, 'name'])
  const spec = Form.useWatch(['rows', fieldName, 'spec'])

  const compositeValue = value
    ? `${value}|${name ?? ''}|${spec ?? ''}`
    : undefined

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
      form.setFieldValue(['rows', fieldName, 'operation'], '')
      return
    }
    const [m = '', n = '', s = ''] = val.split('|')
    onChange?.(m)
    form.setFieldValue(['rows', fieldName, 'name'], n)
    form.setFieldValue(['rows', fieldName, 'spec'], s)
    // 自动填写工序：只要型号唯一匹配一个工序就自动填入
    const ops = operationsByModel.get(m) ?? []
    if (ops.length === 1) {
      form.setFieldValue(['rows', fieldName, 'operation'], ops[0])
    } else {
      form.setFieldValue(['rows', fieldName, 'operation'], '')
    }
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

/**
 * 工序选择器：按当前行型号动态过滤 process_standards 中的工序
 */
function OperationSelectCell({
  fieldName,
  operationsByModel,
}: {
  fieldName: number
  operationsByModel: Map<string, string[]>
}) {
  const model = Form.useWatch(['rows', fieldName, 'model'])
  const ops = model ? (operationsByModel.get(model) ?? []) : []

  const options = ops.map((op) => ({ value: op, label: op }))

  return (
    <Form.Item
      name={[fieldName, 'operation']}
      className="mb-0"
      rules={[{ required: true, message: '请选择工序' }]}
    >
      <Select
        showSearch
        allowClear
        placeholder="工序"
        options={options}
        disabled={!model}
        style={{ width: '100%' }}
        notFoundContent={
          model ? (
            <span className="text-xs text-gray-400">
              该型号无对应工序
            </span>
          ) : (
            <span className="text-xs text-gray-400">请先选择型号</span>
          )
        }
      />
    </Form.Item>
  )
}

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

interface FinishingProcessFormProps {
  orders: VillaLiftOrderSelectOption[]
  onFinish: (values: VillaLiftFinishingBatchFormValues) => Promise<void>
  setFormRef: (form: FormInstance<VillaLiftFinishingBatchFormValues>) => void
}

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------

const DEFAULT_ROW: VillaLiftFinishingRecordFormValues = {
  model: '',
  name: '',
  spec: '',
  operation: '',
  operator: '',
  process_quantity: 0,
  raw_scrap_quantity: 0,
  process_scrap_quantity: 0,
  remarks: '',
}

export default function FinishingProcessForm({
  orders,
  onFinish,
  setFormRef,
}: FinishingProcessFormProps) {
  const [form] = Form.useForm<VillaLiftFinishingBatchFormValues>()
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>()

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  // 获取选中订单的型号列表
  const { data: orderItems = [], isFetching: loadingItems } =
    useVillaLiftOrderItems(selectedOrderId ?? null)

  // 提取当前订单所有型号，查询对应工序
  const models = useMemo(
    () => [...new Set(orderItems.map((item) => item.model).filter(Boolean))],
    [orderItems],
  )
  const { data: opsData = [] } = useProcessOperationsByModels(models)

  // 构建 model -> operation[] 映射
  const operationsByModel = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const { model, operation } of opsData) {
      if (!map.has(model)) map.set(model, [])
      map.get(model)!.push(operation)
    }
    return map
  }, [opsData])

  const orderOptions = orders.map((o) => ({
    value: o.id,
    label: `${o.project_name}`,
    order: o,
  }))

  function handleOrderChange(value: string) {
    setSelectedOrderId(value)
    const rows: VillaLiftFinishingRecordFormValues[] =
      form.getFieldValue('rows') ?? []
    form.setFieldValue(
      'rows',
      rows.map((r) => ({
        ...r,
        model: '',
        name: '',
        spec: '',
        operation: '',
      })),
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

      {/* 加工明细行 */}
      <Form.List
        name="rows"
        rules={[
          {
            validator: async (_, rows) => {
              if (!rows || rows.length === 0)
                return Promise.reject(new Error('请至少添加一条加工记录'))
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
                      operationsByModel={operationsByModel}
                    />
                  </Form.Item>
                  {/* 隐藏锚点：让 name/spec 参与表单提交 */}
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
                  工序 <span className="text-red-500">*</span>
                </span>
              ),
              key: 'operation',
              render: (_: unknown, field: FieldType) => (
                <OperationSelectCell
                  fieldName={field.name}
                  operationsByModel={operationsByModel}
                />
              ),
            },
            {
              title: (
                <span>
                  加工数量 <span className="text-red-500">*</span>
                </span>
              ),
              key: 'process_quantity',
              render: (_: unknown, field: FieldType) => (
                <Form.Item
                  name={[field.name, 'process_quantity']}
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
              <div className="mb-1 grid grid-cols-[3fr_1.5fr_1fr_1fr_1fr_1.5fr_36px] gap-x-2 px-0 text-sm text-gray-500">
                {columns.map((col) => (
                  <div key={String(col.key)}>{col.title}</div>
                ))}
              </div>

              {/* 行 */}
              {fields.map((field) => (
                <div
                  key={field.key}
                  className="mb-2 grid grid-cols-[3fr_1.5fr_1fr_1fr_1fr_1.5fr_36px] items-start gap-x-2"
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
