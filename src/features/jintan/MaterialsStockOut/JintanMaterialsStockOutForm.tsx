import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Form,
  type FormInstance,
  Input,
  InputNumber,
  Select,
} from 'antd'

import type {
  JintanMaterialsStockOut,
  JintanMaterialsStockOutFormValues,
} from '@/services/apiJintanMaterialsStockOut'
import { useJintanMaterialsInventoryOptions } from '../MaterialsInventory/useJintanMaterialsInventory'

interface Props {
  onFinish: (values: JintanMaterialsStockOutFormValues) => void
  setFormRef: (form: FormInstance<JintanMaterialsStockOutFormValues>) => void
  isSubmitting: boolean
  editingRecord?: JintanMaterialsStockOut | null
}

const DEFAULT_VALUES: JintanMaterialsStockOutFormValues = {
  inventory_id: '',
  quantity: 1,
  remarks: '',
}

export default function JintanMaterialsStockOutForm({
  onFinish,
  setFormRef,
  isSubmitting,
  editingRecord,
}: Props) {
  const [form] = Form.useForm<JintanMaterialsStockOutFormValues>()
  const [keyword, setKeyword] = useState('')
  const {
    data: options = [],
    isFetching,
    error,
  } = useJintanMaterialsInventoryOptions(keyword)
  const selectedInventoryId = Form.useWatch('inventory_id', form)
  const selected = options.find((option) => option.id === selectedInventoryId)

  const selectOptions = useMemo(
    () =>
      options.map((option) => ({
        value: option.id,
        label: `${option.material_model ? `${option.material_model} / ` : ''}${option.material_name} / ${option.specification || '无规格'}（库存 ${option.quantity}）`,
      })),
    [options],
  )

  useEffect(() => setFormRef(form), [form, setFormRef])

  useEffect(() => {
    form.resetFields()
    form.setFieldsValue(
      editingRecord
        ? {
            inventory_id: editingRecord.inventory_id,
            quantity: editingRecord.quantity,
            remarks: editingRecord.remarks,
          }
        : DEFAULT_VALUES,
    )
  }, [form, editingRecord])

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      disabled={isSubmitting}
    >
      {editingRecord ? (
        <>
          <Form.Item name="inventory_id" hidden>
            <Input />
          </Form.Item>
          <Form.Item label="素材资料">
            <Input
              disabled
              value={`${editingRecord.material_model ? `${editingRecord.material_model} / ` : ''}${editingRecord.material_name} / ${editingRecord.specification || '无规格'}`}
            />
          </Form.Item>
        </>
      ) : (
        <Form.Item
          name="inventory_id"
          label="素材资料"
          rules={[{ required: true, message: '请选择素材' }]}
        >
          <Select
            showSearch={{ filterOption: false, onSearch: setKeyword }}
            options={selectOptions}
            loading={isFetching}
            placeholder="按型号、名称、规格或材质查找素材"
          />
        </Form.Item>
      )}
      {!editingRecord && error && (
        <Alert type="error" showIcon title="素材列表加载失败，请重试" />
      )}
      {!editingRecord && selected && (
        <div className="mb-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-700 dark:text-slate-200">
          <div>
            型号：{selected.material_model || '-'} / 名称：
            {selected.material_name}
          </div>
          <div>
            规格：{selected.specification || '-'} / 材质：
            {selected.material || '-'}
          </div>
          <div>当前库存：{selected.quantity}</div>
        </div>
      )}
      <Form.Item
        name="quantity"
        label="出库数量"
        dependencies={['inventory_id']}
        rules={[
          { required: true, message: '请输入出库数量' },
          { type: 'integer', min: 1, message: '出库数量必须为正整数' },
          {
            validator: async (_rule, value: number) => {
              const currentOption = options.find(
                (option) => option.id === form.getFieldValue('inventory_id'),
              )
              if (
                !editingRecord &&
                currentOption &&
                value > currentOption.quantity
              ) {
                throw new Error(
                  `库存不足，当前库存为 ${currentOption.quantity}`,
                )
              }
            },
          },
        ]}
      >
        <InputNumber
          min={1}
          precision={0}
          className="w-full"
          placeholder="请输入出库数量"
          disabled={Boolean(editingRecord)}
        />
      </Form.Item>
      <Form.Item name="remarks" label="备注">
        <Input.TextArea rows={3} maxLength={500} placeholder="备注（可选）" />
      </Form.Item>
    </Form>
  )
}
