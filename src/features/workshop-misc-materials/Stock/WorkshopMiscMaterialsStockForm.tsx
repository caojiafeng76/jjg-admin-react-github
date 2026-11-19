import type { FormInstance } from 'antd'
import type {
  WorkshopMiscMaterialsStockDirection,
  WorkshopMiscMaterialsStockFormValues,
  WorkshopMiscMaterialsStockRecord,
} from '@/services/apiWorkshopMiscMaterialsStock'
import { Alert, Form, Input, InputNumber, Select } from 'antd'
import { useEffect, useMemo, useState } from 'react'

import { WORKSHOP_MISC_MATERIALS_STOCK_LABELS } from '@/services/apiWorkshopMiscMaterialsStock'
import { formatQuantity, formatWorkshopMiscMaterialLabel } from '../display'
import { useWorkshopMiscMaterialsInventoryOptions } from '../Inventory/useWorkshopMiscMaterialsInventory'

/** 快捷建单：锁定为指定库存行（资料详情抽屉内使用） */
export interface WorkshopMiscMaterialsQuickInventory {
  id: string
  label: string
  raw_material_quantity: number
  semi_finished_quantity: number
  finished_quantity: number
  total_quantity: number
}

export interface WorkshopMiscMaterialsStockFormProps {
  direction: WorkshopMiscMaterialsStockDirection
  onFinish: (values: WorkshopMiscMaterialsStockFormValues) => void
  setFormRef: (form: FormInstance<WorkshopMiscMaterialsStockFormValues>) => void
  isSubmitting: boolean
  /** 编辑时只允许改备注 */
  editingRecord?: WorkshopMiscMaterialsStockRecord | null
  quickInventory?: WorkshopMiscMaterialsQuickInventory | null
}

const DEFAULT_VALUES: WorkshopMiscMaterialsStockFormValues = {
  inventory_id: '',
  raw_material_quantity: 0,
  semi_finished_quantity: 0,
  finished_quantity: 0,
  remarks: '',
}

export default function WorkshopMiscMaterialsStockForm({
  direction,
  onFinish,
  setFormRef,
  isSubmitting,
  editingRecord,
  quickInventory,
}: WorkshopMiscMaterialsStockFormProps) {
  const label = WORKSHOP_MISC_MATERIALS_STOCK_LABELS[direction]
  const [form] = Form.useForm<WorkshopMiscMaterialsStockFormValues>()
  const [keyword, setKeyword] = useState('')
  const showPicker = !editingRecord && !quickInventory

  const {
    data: options = [],
    isFetching,
    error,
  } = useWorkshopMiscMaterialsInventoryOptions(keyword)

  const selectedInventoryId = Form.useWatch('inventory_id', form)
  const watchedRaw = Form.useWatch('raw_material_quantity', form) ?? 0
  const watchedSemi = Form.useWatch('semi_finished_quantity', form) ?? 0
  const watchedFinished = Form.useWatch('finished_quantity', form) ?? 0

  const selected = options.find(option => option.id === selectedInventoryId)
  const activeStock = quickInventory ?? selected

  const selectOptions = useMemo(
    () =>
      options.map(option => ({
        value: option.id,
        label: `${formatWorkshopMiscMaterialLabel(option)}（库存 ${option.total_quantity}）`,
      })),
    [options],
  )

  useEffect(() => setFormRef(form), [form, setFormRef])

  useEffect(() => {
    form.resetFields()
    if (editingRecord) {
      form.setFieldsValue({
        inventory_id: editingRecord.inventory_id,
        raw_material_quantity: editingRecord.raw_material_quantity,
        semi_finished_quantity: editingRecord.semi_finished_quantity,
        finished_quantity: editingRecord.finished_quantity,
        remarks: editingRecord.remarks,
      })
      return
    }
    if (quickInventory) {
      form.setFieldsValue({ ...DEFAULT_VALUES, inventory_id: quickInventory.id })
      return
    }
    form.setFieldsValue(DEFAULT_VALUES)
  }, [form, editingRecord, quickInventory])

  const lockedLabel = editingRecord
    ? formatWorkshopMiscMaterialLabel(editingRecord)
    : quickInventory?.label

  const resolveAvailable = (
    stageKey: 'raw_material_quantity' | 'semi_finished_quantity' | 'finished_quantity',
  ): number | undefined => {
    if (quickInventory) {
      return quickInventory[stageKey]
    }
    const id = form.getFieldValue('inventory_id') as string | undefined
    return options.find(option => option.id === id)?.[stageKey]
  }

  const stageLocked = Boolean(editingRecord)
  const currentFormTotal = watchedRaw + watchedSemi + watchedFinished

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={values =>
        onFinish({
          inventory_id: values.inventory_id,
          raw_material_quantity: values.raw_material_quantity ?? 0,
          semi_finished_quantity: values.semi_finished_quantity ?? 0,
          finished_quantity: values.finished_quantity ?? 0,
          remarks: values.remarks ?? '',
        })}
      disabled={isSubmitting}
    >
      {showPicker
        ? (
            <Form.Item
              name="inventory_id"
              label="材料"
              rules={[{ required: true, message: '请选择材料' }]}
            >
              <Select
                showSearch={{ filterOption: false, onSearch: setKeyword }}
                options={selectOptions}
                loading={isFetching}
                placeholder="按型号、客户型号、规格或类别查找材料"
              />
            </Form.Item>
          )
        : (
            <>
              <Form.Item name="inventory_id" hidden>
                <Input />
              </Form.Item>
              <Form.Item label="材料">
                <Input disabled value={lockedLabel} />
              </Form.Item>
            </>
          )}

      {showPicker && error && (
        <Alert type="error" showIcon title="材料列表加载失败，请重试" />
      )}

      {!editingRecord && activeStock && (
        <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-600 sm:grid-cols-4 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
          <div>
            原材料库存：
            <span className="font-medium tabular-nums">
              {formatQuantity(activeStock.raw_material_quantity)}
            </span>
          </div>
          <div>
            半成品库存：
            <span className="font-medium tabular-nums">
              {formatQuantity(activeStock.semi_finished_quantity)}
            </span>
          </div>
          <div>
            成品库存：
            <span className="font-medium tabular-nums">
              {formatQuantity(activeStock.finished_quantity)}
            </span>
          </div>
          <div>
            当前合计：
            <span className="font-semibold text-slate-900 tabular-nums dark:text-slate-100">
              {formatQuantity(activeStock.total_quantity)}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Form.Item
          name="raw_material_quantity"
          label={`原材料${label}数量`}
          dependencies={['inventory_id', 'semi_finished_quantity', 'finished_quantity']}
          rules={[
            {
              validator: async (_rule, rawValue: number | null | undefined) => {
                const raw = rawValue ?? 0
                if (!Number.isSafeInteger(raw) || raw < 0) {
                  throw new Error(`原材料${label}数量必须为非负整数`)
                }
                const semi = Number(form.getFieldValue('semi_finished_quantity') ?? 0)
                const finished = Number(form.getFieldValue('finished_quantity') ?? 0)
                if (raw + semi + finished <= 0) {
                  throw new Error(`请至少填写一项大于 0 的${label}数量`)
                }
                if (direction === 'out' && !editingRecord) {
                  const available = resolveAvailable('raw_material_quantity')
                  if (available !== undefined && raw > available) {
                    throw new Error(`原材料库存不足，当前库存为 ${available}`)
                  }
                }
              },
            },
          ]}
        >
          <InputNumber
            min={0}
            precision={0}
            className="w-full"
            placeholder="0"
            disabled={stageLocked}
          />
        </Form.Item>

        <Form.Item
          name="semi_finished_quantity"
          label={`半成品${label}数量`}
          dependencies={['inventory_id']}
          rules={[
            {
              validator: async (_rule, semiValue: number | null | undefined) => {
                const semi = semiValue ?? 0
                if (!Number.isSafeInteger(semi) || semi < 0) {
                  throw new Error(`半成品${label}数量必须为非负整数`)
                }
                if (direction === 'out' && !editingRecord) {
                  const available = resolveAvailable('semi_finished_quantity')
                  if (available !== undefined && semi > available) {
                    throw new Error(`半成品库存不足，当前库存为 ${available}`)
                  }
                }
              },
            },
          ]}
        >
          <InputNumber
            min={0}
            precision={0}
            className="w-full"
            placeholder="0"
            disabled={stageLocked}
          />
        </Form.Item>

        <Form.Item
          name="finished_quantity"
          label={`成品${label}数量`}
          dependencies={['inventory_id']}
          rules={[
            {
              validator: async (_rule, finishedValue: number | null | undefined) => {
                const finished = finishedValue ?? 0
                if (!Number.isSafeInteger(finished) || finished < 0) {
                  throw new Error(`成品${label}数量必须为非负整数`)
                }
                if (direction === 'out' && !editingRecord) {
                  const available = resolveAvailable('finished_quantity')
                  if (available !== undefined && finished > available) {
                    throw new Error(`成品库存不足，当前库存为 ${available}`)
                  }
                }
              },
            },
          ]}
        >
          <InputNumber
            min={0}
            precision={0}
            className="w-full"
            placeholder="0"
            disabled={stageLocked}
          />
        </Form.Item>
      </div>

      <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
        本次{label}合计：
        <span className="font-semibold text-slate-900 tabular-nums dark:text-slate-100">
          {formatQuantity(currentFormTotal)}
        </span>
      </div>

      <Form.Item
        name="remarks"
        label="备注"
        rules={[{ max: 500, message: '备注不能超过 500 个字符' }]}
      >
        <Input.TextArea rows={3} maxLength={500} placeholder="备注（可选）" />
      </Form.Item>
    </Form>
  )
}
