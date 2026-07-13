import { useEffect, useMemo, useState } from 'react'
import { Form, type FormInstance, Input, InputNumber, Select } from 'antd'

import type {
  YoumaiRawMaterialStockIn,
  YoumaiRawMaterialStockInFormValues,
} from '@/services/apiYoumaiRawMaterialStockIn'
import type { YoumaiRawMaterialInventoryOption } from '@/services/apiYoumaiRawMaterialInventory'

import { useRemoteSelectOptions } from '../remoteSelectOptions'
import { useYoumaiRawMaterialInventoryOption } from '../RawMaterialInventory/useYoumaiRawMaterialInventory'
import { useYoumaiRawMaterialInventoryOptions } from './useYoumaiRawMaterialStockIn'

interface Props {
  onFinish: (values: YoumaiRawMaterialStockInFormValues) => void
  setFormRef: (form: FormInstance<YoumaiRawMaterialStockInFormValues>) => void
  isSubmitting: boolean
  isEdit?: boolean
  editingRecord?: YoumaiRawMaterialStockIn | null
}

const DEFAULT_VALUES: YoumaiRawMaterialStockInFormValues = {
  inventory_id: '',
  quantity: 1,
  remarks: '',
}

export default function YoumaiRawMaterialStockInForm({
  onFinish,
  setFormRef,
  isSubmitting,
  isEdit = false,
  editingRecord,
}: Props) {
  const [form] = Form.useForm<YoumaiRawMaterialStockInFormValues>()
  const [inventoryOptionKeyword, setInventoryOptionKeyword] = useState('')
  const {
    data: inventoryOptions = [],
    isFetching: areInventoryOptionsLoading,
  } = useYoumaiRawMaterialInventoryOptions(inventoryOptionKeyword)
  const { data: editingInventoryOption } =
    useYoumaiRawMaterialInventoryOption(
      isEdit ? editingRecord?.inventory_id : undefined,
    )
  const initialInventorySnapshot = useMemo(
    () =>
      isEdit && editingRecord
        ? editingInventoryOption ??
          inventoryOptions.find(
            (option) => option.id === editingRecord.inventory_id,
          )
        : undefined,
    [editingInventoryOption, editingRecord, inventoryOptions, isEdit],
  )
  const { mergedOptions, rememberSelectedOption } =
    useRemoteSelectOptions<YoumaiRawMaterialInventoryOption>(
      inventoryOptions,
      initialInventorySnapshot,
    )
  const selectedInventoryId = Form.useWatch('inventory_id', form)

  const selectedOption = useMemo(
    () => mergedOptions.find((item) => item.id === selectedInventoryId),
    [mergedOptions, selectedInventoryId],
  )

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    if (isEdit && editingRecord) {
      form.setFieldsValue({
        inventory_id: editingRecord.inventory_id,
        quantity: editingRecord.quantity,
        remarks: editingRecord.remarks,
      })
      return
    }
    form.resetFields()
    form.setFieldsValue(DEFAULT_VALUES)
  }, [form, isEdit, editingRecord])

  const options = useMemo(
    () =>
      mergedOptions.map((item) => ({
        value: item.id,
        label: `${item.model} - ${item.specification}（当前库存：${item.quantity}）`,
        model: item.model,
        specification: item.specification,
      })),
    [mergedOptions],
  )

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      disabled={isSubmitting}
    >
      <Form.Item
        name="inventory_id"
        label="原料（型号 - 规格）"
        rules={[{ required: true, message: '请选择原料' }]}
      >
        {isEdit && editingRecord ? (
          <Input
            disabled
            value={`${editingRecord.model} - ${editingRecord.specification}`}
          />
        ) : (
          <Select
            showSearch={{
              filterOption: false,
              onSearch: setInventoryOptionKeyword,
            }}
            onChange={rememberSelectedOption}
            loading={areInventoryOptionsLoading}
            placeholder="请选择原料"
            options={options}
          />
        )}
      </Form.Item>

      {!isEdit && selectedOption && (
        <div className="mb-4 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          当前库存：
          <span className="font-semibold">{selectedOption.quantity}</span>
        </div>
      )}

      <Form.Item
        name="quantity"
        label="入库数量"
        rules={[
          { required: true, message: '请输入入库数量' },
          { type: 'number', min: 1, message: '入库数量至少为 1' },
        ]}
      >
        <InputNumber
          min={1}
          precision={0}
          className="w-full"
          placeholder="请输入入库数量"
          disabled={isEdit}
        />
      </Form.Item>

      <Form.Item name="remarks" label="备注">
        <Input.TextArea rows={3} placeholder="备注（可选）" maxLength={200} />
      </Form.Item>
    </Form>
  )
}
