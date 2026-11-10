import type { FormInstance } from 'antd'
import type {
  SyneyMaterialsStockDirection,
  SyneyMaterialsStockFormValues,
  SyneyMaterialsStockRecord,
} from '@/services/apiSyneyMaterialsStock'
import { Alert, Form, Input, InputNumber, Select } from 'antd'
import { useEffect, useMemo, useState } from 'react'

import { SYNEY_MATERIALS_STOCK_LABELS } from '@/services/apiSyneyMaterialsStock'
import { formatSyneyMaterialLabel } from '../display'
import { useSyneyMaterialsInventoryOptions } from '../Inventory/useSyneyMaterialsInventory'

/** 快捷建单：锁定为指定库存行（资料详情抽屉内使用） */
export interface SyneyMaterialsQuickInventory {
  id: string
  label: string
  quantity: number
}

export interface SyneyMaterialsStockFormProps {
  direction: SyneyMaterialsStockDirection
  onFinish: (values: SyneyMaterialsStockFormValues) => void
  setFormRef: (form: FormInstance<SyneyMaterialsStockFormValues>) => void
  isSubmitting: boolean
  /** 编辑时只允许改备注 */
  editingRecord?: SyneyMaterialsStockRecord | null
  quickInventory?: SyneyMaterialsQuickInventory | null
}

const DEFAULT_VALUES: SyneyMaterialsStockFormValues = {
  inventory_id: '',
  quantity: 1,
  remarks: '',
}

export default function SyneyMaterialsStockForm({
  direction,
  onFinish,
  setFormRef,
  isSubmitting,
  editingRecord,
  quickInventory,
}: SyneyMaterialsStockFormProps) {
  const label = SYNEY_MATERIALS_STOCK_LABELS[direction]
  const [form] = Form.useForm<SyneyMaterialsStockFormValues>()
  const [keyword, setKeyword] = useState('')
  const showPicker = !editingRecord && !quickInventory
  const {
    data: options = [],
    isFetching,
    error,
  } = useSyneyMaterialsInventoryOptions(keyword)
  const selectedInventoryId = Form.useWatch('inventory_id', form)
  const selected = options.find(option => option.id === selectedInventoryId)

  const selectOptions = useMemo(
    () =>
      options.map(option => ({
        value: option.id,
        label: `${formatSyneyMaterialLabel(option)}（库存 ${option.quantity}）`,
      })),
    [options],
  )

  useEffect(() => setFormRef(form), [form, setFormRef])

  useEffect(() => {
    form.resetFields()
    if (editingRecord) {
      form.setFieldsValue({
        inventory_id: editingRecord.inventory_id,
        quantity: editingRecord.quantity,
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
    ? formatSyneyMaterialLabel(editingRecord)
    : quickInventory?.label

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
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
                placeholder="按品名或规格查找材料"
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
      {showPicker && selected && (
        <div className="mb-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-700 dark:text-slate-200">
          <div>
            品名：{selected.material_name} / 规格：{selected.specification || '-'}
          </div>
          <div>
            当前库存：{selected.quantity} {selected.unit}
          </div>
        </div>
      )}
      <Form.Item
        name="quantity"
        label={`${label}数量`}
        dependencies={['inventory_id']}
        rules={[
          { required: true, message: `请输入${label}数量` },
          { type: 'integer', min: 1, message: `${label}数量必须为正整数` },
          {
            validator: async (_rule, value: number) => {
              if (direction !== 'out' || editingRecord || typeof value !== 'number')
                return
              // 直接读字段：useWatch 的值在同一轮 setFieldsValue + submit 中可能还没更新
              const available = quickInventory?.quantity
                ?? options.find(option => option.id === form.getFieldValue('inventory_id'))?.quantity
              if (available !== undefined && value > available)
                throw new Error(`库存不足，当前库存为 ${available}`)
            },
          },
        ]}
      >
        <InputNumber
          min={1}
          precision={0}
          className="w-full"
          placeholder={`请输入${label}数量`}
          disabled={Boolean(editingRecord)}
        />
      </Form.Item>
      <Form.Item name="remarks" label="备注">
        <Input.TextArea rows={3} maxLength={500} placeholder="备注（可选）" />
      </Form.Item>
    </Form>
  )
}
