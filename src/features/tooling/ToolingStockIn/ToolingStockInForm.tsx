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
  ToolingDataOption,
  ToolingStockIn,
  ToolingStockInFormValues,
} from '@/services/apiToolingStockIn'
import {
  createToolingOptionSnapshot,
  mergeToolingOptions,
  type RemoteToolingOption,
} from '../remoteToolingOptions'

interface Props {
  onFinish: (values: ToolingStockInFormValues) => void
  setFormRef: (form: FormInstance<ToolingStockInFormValues>) => void
  isSubmitting: boolean
  toolingOptions: ToolingDataOption[]
  isToolingOptionsLoading: boolean
  onToolingSearch: (keyword: string) => void
  initialValues?: ToolingStockIn | ToolingStockInFormValues
  isAuditLocked?: boolean
}

const DEFAULT_VALUES: ToolingStockInFormValues = {
  tooling_data_id: '',
  status: '待审核',
  stock_in_quantity: 0,
  remarks: '',
}

export default function ToolingStockInForm({
  onFinish,
  setFormRef,
  isSubmitting,
  toolingOptions,
  isToolingOptionsLoading,
  onToolingSearch,
  initialValues,
  isAuditLocked = false,
}: Props) {
  const [form] = Form.useForm<ToolingStockInFormValues>()
  const [selectedToolingSnapshot, setSelectedToolingSnapshot] =
    useState<RemoteToolingOption>()
  const selectedToolingId = Form.useWatch('tooling_data_id', form)

  const mergedToolingOptions = useMemo(
    () => mergeToolingOptions(toolingOptions, selectedToolingSnapshot),
    [selectedToolingSnapshot, toolingOptions],
  )

  const selectedTooling = useMemo(
    () => mergedToolingOptions.find((item) => item.id === selectedToolingId),
    [mergedToolingOptions, selectedToolingId],
  )

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    const initialSnapshot = createToolingOptionSnapshot(initialValues)
    setSelectedToolingSnapshot(initialSnapshot)

    if (initialValues) {
      form.setFieldsValue({
        ...DEFAULT_VALUES,
        tooling_data_id: initialValues.tooling_data_id,
        status: initialValues.status,
        stock_in_quantity: Number(initialValues.stock_in_quantity || 0),
        remarks: initialValues.remarks,
      })
      return
    }

    form.resetFields()
    form.setFieldsValue(DEFAULT_VALUES)
  }, [form, initialValues])

  useEffect(() => {
    setSelectedToolingSnapshot((snapshot) => {
      if (!snapshot) return snapshot

      return (
        toolingOptions.find((option) => option.id === snapshot.id) ?? snapshot
      )
    })
  }, [selectedToolingSnapshot?.id, toolingOptions])

  const handleToolingChange = (toolingId: string) => {
    const nextSnapshot = mergedToolingOptions.find(
      (item) => item.id === toolingId,
    )
    setSelectedToolingSnapshot(nextSnapshot)
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      disabled={isSubmitting}
    >
      {isAuditLocked && (
        <Alert
          className="mb-4"
          type="info"
          showIcon
          title="当前记录已审核，仅允许修改备注。刀具和入库数量已锁定；审核与反审请使用页面顶部按钮。"
        />
      )}

      <Form.Item
        name="tooling_data_id"
        label="关联刀具资料"
        rules={[{ required: true, message: '请选择刀具资料' }]}
      >
        <Select
          disabled={isAuditLocked}
          loading={isToolingOptionsLoading}
          showSearch={{
            filterOption: false,
            onSearch: onToolingSearch,
          }}
          onChange={handleToolingChange}
          placeholder={
            mergedToolingOptions.length > 0
              ? '请选择刀具资料'
              : '暂无刀具资料，请先维护刀具资料'
          }
          options={mergedToolingOptions.map((item) => ({
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
          name="stock_in_quantity"
          label="入库数量"
          rules={[{ required: true, message: '请输入入库数量' }]}
        >
          <InputNumber
            disabled={isAuditLocked}
            min={0.001}
            step={0.001}
            precision={3}
            style={{ width: '100%' }}
            placeholder="请输入入库数量"
          />
        </Form.Item>
      </div>

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
