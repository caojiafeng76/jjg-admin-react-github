import { useEffect, useMemo } from 'react'
import { Form, type FormInstance, Input, InputNumber, Select } from 'antd'

import type {
  ToolingDataOption,
  ToolingInventory,
  ToolingInventoryFormValues,
} from '@/services/apiToolingInventory'

interface Props {
  onFinish: (values: ToolingInventoryFormValues) => void
  setFormRef: (form: FormInstance<ToolingInventoryFormValues>) => void
  isSubmitting: boolean
  toolingOptions: ToolingDataOption[]
  initialValues?: ToolingInventory | ToolingInventoryFormValues
}

const DEFAULT_VALUES: ToolingInventoryFormValues = {
  tooling_data_id: '',
  pending_stock_in: 0,
  pending_stock_out: 0,
  current_stock: 0,
  remarks: '',
}

export default function ToolingInventoryForm({
  onFinish,
  setFormRef,
  isSubmitting,
  toolingOptions,
  initialValues,
}: Props) {
  const [form] = Form.useForm<ToolingInventoryFormValues>()
  const selectedToolingId = Form.useWatch('tooling_data_id', form)

  const selectedTooling = useMemo(
    () => toolingOptions.find((item) => item.id === selectedToolingId),
    [toolingOptions, selectedToolingId],
  )

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...DEFAULT_VALUES,
        tooling_data_id: initialValues.tooling_data_id,
        pending_stock_in: Number(initialValues.pending_stock_in || 0),
        pending_stock_out: Number(initialValues.pending_stock_out || 0),
        current_stock: Number(initialValues.current_stock || 0),
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
      <Form.Item
        name="tooling_data_id"
        label="关联刀具资料"
        rules={[{ required: true, message: '请选择刀具资料' }]}
      >
        <Select
          showSearch={{
            filterOption: (input, option) =>
              String(option?.label || '')
                .toLowerCase()
                .includes(input.toLowerCase()),
          }}
          placeholder={
            toolingOptions.length > 0
              ? '请选择刀具资料'
              : '暂无刀具资料，请先维护刀具资料'
          }
          options={toolingOptions.map((item) => ({
            value: item.id,
            label: `${item.tool_code} | ${item.tool_name} | ${item.tool_spec}`,
          }))}
        />
      </Form.Item>

      <div className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 md:grid-cols-2">
        <div>
          <div className="text-xs text-slate-400">刀具编号</div>
          <div>{selectedTooling?.tool_code || '-'}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">刀具名称</div>
          <div>{selectedTooling?.tool_name || '-'}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">刀具规格</div>
          <div>{selectedTooling?.tool_spec || '-'}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">材质</div>
          <div>{selectedTooling?.material || '-'}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">单价</div>
          <div>
            {selectedTooling
              ? Number(selectedTooling.unit_price).toFixed(2)
              : '-'}
          </div>
        </div>
      </div>

      <Form.Item name="pending_stock_in" hidden>
        <InputNumber />
      </Form.Item>

      <Form.Item name="pending_stock_out" hidden>
        <InputNumber />
      </Form.Item>

      <Form.Item
        name="current_stock"
        label="现有库存"
        rules={[{ required: true, message: '请输入现有库存' }]}
      >
        <InputNumber
          min={0}
          step={0.001}
          precision={3}
          style={{ width: '100%' }}
          placeholder="请输入现有库存"
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
