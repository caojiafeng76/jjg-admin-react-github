import { useEffect, useMemo } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import {
  Alert,
  DatePicker,
  Form,
  type FormInstance,
  Input,
  InputNumber,
  Select,
} from 'antd'

import type {
  ToolingDataOption,
  ToolingStockOut,
  ToolingStockOutFormValues,
} from '@/services/apiToolingStockOut'

interface ToolingStockOutFormFields {
  tooling_data_id: string
  recipient: string
  purpose: string
  stock_out_date: Dayjs | null
  status: '待审核' | '已审核'
  stock_out_quantity: number
  remarks: string
}

interface Props {
  onFinish: (values: ToolingStockOutFormValues) => void
  setFormRef: (form: FormInstance) => void
  isSubmitting: boolean
  toolingOptions: ToolingDataOption[]
  initialValues?: ToolingStockOut | ToolingStockOutFormValues
  isAuditLocked?: boolean
}

const DEFAULT_VALUES: ToolingStockOutFormFields = {
  tooling_data_id: '',
  recipient: '',
  purpose: '',
  stock_out_date: null,
  status: '待审核',
  stock_out_quantity: 0,
  remarks: '',
}

export default function ToolingStockOutForm({
  onFinish,
  setFormRef,
  isSubmitting,
  toolingOptions,
  initialValues,
  isAuditLocked = false,
}: Props) {
  const [form] = Form.useForm<ToolingStockOutFormFields>()
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
        recipient: initialValues.recipient,
        purpose: initialValues.purpose,
        stock_out_date: initialValues.stock_out_date
          ? dayjs(initialValues.stock_out_date)
          : null,
        status: initialValues.status,
        stock_out_quantity: Number(initialValues.stock_out_quantity || 0),
        remarks: initialValues.remarks,
      })
      return
    }

    form.resetFields()
    form.setFieldsValue(DEFAULT_VALUES)
  }, [form, initialValues])

  const handleFinish = (values: ToolingStockOutFormFields) => {
    onFinish({
      tooling_data_id: values.tooling_data_id,
      recipient: values.recipient.trim(),
      purpose: values.purpose.trim(),
      stock_out_date: values.stock_out_date?.format('YYYY-MM-DD') || '',
      status: values.status,
      stock_out_quantity: Number(values.stock_out_quantity || 0),
      remarks: values.remarks.trim(),
    })
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      disabled={isSubmitting}
    >
      {isAuditLocked && (
        <Alert
          className="mb-4"
          type="info"
          showIcon
          title="当前记录已审核，仅允许修改备注。刀具、领用信息、出库日期和出库数量已锁定；审核与反审请使用页面顶部按钮。"
        />
      )}

      <Form.Item
        name="tooling_data_id"
        label="关联刀具资料"
        rules={[{ required: true, message: '请选择刀具资料' }]}
      >
        <Select
          disabled={isAuditLocked}
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Form.Item
          name="recipient"
          label="领用人"
          rules={[{ required: true, message: '请输入领用人' }]}
        >
          <Input disabled={isAuditLocked} placeholder="请输入领用人" />
        </Form.Item>

        <Form.Item
          name="stock_out_date"
          label="出库日期"
          rules={[{ required: true, message: '请选择出库日期' }]}
        >
          <DatePicker
            disabled={isAuditLocked}
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
          />
        </Form.Item>
      </div>

      <Form.Item
        name="purpose"
        label="用途"
        rules={[{ required: true, message: '请输入用途' }]}
      >
        <Input disabled={isAuditLocked} placeholder="请输入用途" />
      </Form.Item>

      <Form.Item
        name="stock_out_quantity"
        label="出库数量"
        rules={[{ required: true, message: '请输入出库数量' }]}
      >
        <InputNumber
          disabled={isAuditLocked}
          min={0.001}
          step={0.001}
          precision={3}
          style={{ width: '100%' }}
          placeholder="请输入出库数量"
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
