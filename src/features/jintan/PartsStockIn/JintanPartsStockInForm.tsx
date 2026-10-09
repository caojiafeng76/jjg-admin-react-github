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
  JintanPartsStockIn,
  JintanPartsStockInFormValues,
} from '@/services/apiJintanPartsStockIn'
import { useJintanPartsInventoryOptions } from '../PartsInventory/useJintanPartsInventory'

interface Props {
  onFinish: (values: JintanPartsStockInFormValues) => void
  setFormRef: (form: FormInstance<JintanPartsStockInFormValues>) => void
  isSubmitting: boolean
  editingRecord?: JintanPartsStockIn | null
  /**
   * 快捷建单模式：锁定为指定库存行（行详情抽屉内新建入库时使用）。
   * 与 editingRecord 互斥，存在时不再展示库存选择器。
   */
  quickInventory?: JintanPartsQuickInventory | null
}

export interface JintanPartsQuickInventory {
  id: string
  label: string
  quantity: number
}

const DEFAULT_VALUES: JintanPartsStockInFormValues = {
  inventory_id: '',
  quantity: 1,
  remarks: '',
}

export default function JintanPartsStockInForm({
  onFinish,
  setFormRef,
  isSubmitting,
  editingRecord,
  quickInventory,
}: Props) {
  const [form] = Form.useForm<JintanPartsStockInFormValues>()
  const [keyword, setKeyword] = useState('')
  const {
    data: options = [],
    isFetching,
    error,
  } = useJintanPartsInventoryOptions(keyword)
  const selectedInventoryId = Form.useWatch('inventory_id', form)
  const selected = options.find((option) => option.id === selectedInventoryId)

  const selectOptions = useMemo(
    () =>
      options.map((option) => ({
        value: option.id,
        label: `${option.part_name} / ${option.specification || '无规格'}（库存 ${option.quantity}）`,
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
      form.setFieldsValue({
        inventory_id: quickInventory.id,
        quantity: 1,
        remarks: '',
      })
      return
    }
    form.setFieldsValue(DEFAULT_VALUES)
  }, [form, editingRecord, quickInventory])

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
          <Form.Item label="配件资料">
            <Input
              disabled
              value={`${editingRecord.part_name} / ${editingRecord.specification || '无规格'}`}
            />
          </Form.Item>
        </>
      ) : quickInventory ? (
        <>
          <Form.Item name="inventory_id" hidden>
            <Input />
          </Form.Item>
          <Form.Item label="配件资料">
            <Input disabled value={quickInventory.label} />
          </Form.Item>
        </>
      ) : (
        <Form.Item
          name="inventory_id"
          label="配件资料"
          rules={[{ required: true, message: '请选择配件' }]}
        >
          <Select
            showSearch={{ filterOption: false, onSearch: setKeyword }}
            options={selectOptions}
            loading={isFetching}
            placeholder="按名称、规格、材质或采购厂家查找配件"
          />
        </Form.Item>
      )}
      {!editingRecord && !quickInventory && error && (
        <Alert type="error" showIcon title="配件列表加载失败，请重试" />
      )}
      {!editingRecord && !quickInventory && selected && (
        <div className="mb-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-700 dark:text-slate-200">
          <div>
            名称：{selected.part_name} / 规格：{selected.specification || '-'}
          </div>
          <div>
            材质：{selected.material || '-'} / 采购厂家：
            {selected.supplier || '-'}
          </div>
          <div>当前库存：{selected.quantity}</div>
        </div>
      )}
      <Form.Item
        name="quantity"
        label="入库数量"
        rules={[
          { required: true, message: '请输入入库数量' },
          { type: 'integer', min: 1, message: '入库数量必须为正整数' },
        ]}
      >
        <InputNumber
          min={1}
          precision={0}
          className="w-full"
          placeholder="请输入入库数量"
          disabled={Boolean(editingRecord)}
        />
      </Form.Item>
      <Form.Item name="remarks" label="备注">
        <Input.TextArea rows={3} maxLength={500} placeholder="备注（可选）" />
      </Form.Item>
    </Form>
  )
}
