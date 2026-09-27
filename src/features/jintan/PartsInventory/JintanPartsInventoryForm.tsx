import { useEffect } from 'react'
import { Form, FormInstance, Input, InputNumber } from 'antd'

import type {
  JintanPartsInventory,
  JintanPartsInventoryFormValues,
} from '@/services/apiJintanPartsInventory'

interface Props {
  onFinish: (values: JintanPartsInventoryFormValues) => void
  setFormRef: (form: FormInstance<JintanPartsInventoryFormValues>) => void
  isSubmitting: boolean
  initialValues?: JintanPartsInventory | JintanPartsInventoryFormValues
}

const DEFAULT_VALUES: JintanPartsInventoryFormValues = {
  quantity: 0,
  remarks: '',
}

export default function JintanPartsInventoryForm({
  onFinish,
  setFormRef,
  isSubmitting,
  initialValues,
}: Props) {
  const [form] = Form.useForm<JintanPartsInventoryFormValues>()

  const partSnapshot =
    initialValues && 'part_data_id' in initialValues ? initialValues : undefined

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...DEFAULT_VALUES,
        quantity: Number(initialValues.quantity || 0),
        remarks: initialValues.remarks,
      })
      return
    }

    form.resetFields()
    form.setFieldsValue(DEFAULT_VALUES)
  }, [form, initialValues])

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      disabled={isSubmitting}
    >
      {partSnapshot && (
        <div className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 md:grid-cols-2">
          <div>
            <div className="text-xs text-slate-400">名称</div>
            <div>{partSnapshot.part_name || '-'}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">规格</div>
            <div>{partSnapshot.specification || '-'}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">材质</div>
            <div>{partSnapshot.material || '-'}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">采购厂家</div>
            <div>{partSnapshot.supplier || '-'}</div>
          </div>
        </div>
      )}

      <Form.Item
        name="quantity"
        label="库存数量"
        rules={[{ required: true, message: '请输入库存数量' }]}
      >
        <InputNumber
          min={0}
          precision={0}
          style={{ width: '100%' }}
          placeholder="请输入库存数量"
        />
      </Form.Item>

      <Form.Item
        name="remarks"
        label="备注"
        rules={[{ max: 500, message: '备注不能超过 500 个字符' }]}
      >
        <Input.TextArea
          placeholder="请输入备注"
          maxLength={500}
          autoSize={{ minRows: 3, maxRows: 5 }}
        />
      </Form.Item>
    </Form>
  )
}
