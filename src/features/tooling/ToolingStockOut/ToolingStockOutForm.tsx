import { useEffect, useMemo, useState } from 'react'
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

import type { MachineEquipmentOption } from '@/services/apiMachineEquipmentMaintenances'
import type {
  ToolingDataOption,
  ToolingStockOut,
  ToolingStockOutFormValues,
} from '@/services/apiToolingStockOut'
import MobileBottomSelectSheet, {
  type MobileBottomSelectOption,
} from '@/ui/mobile/MobileBottomSelectSheet'
import MobileNumberInput from '@/ui/mobile/MobileNumberInput'
import {
  buildToolingOptionKeywords,
  matchesToolingOptionKeyword,
} from '@/utils/toolingOptionSearch'

interface ToolingStockOutFormFields {
  tooling_data_id: string
  machine_equipment_id: string
  recipient: string
  purpose: string
  stock_out_date: Dayjs | null
  status: '待审核' | '已审核'
  stock_out_quantity: number
  collection_method: string
  remarks: string
}

interface Props {
  onFinish: (values: ToolingStockOutFormValues) => void
  setFormRef: (form: FormInstance) => void
  isSubmitting: boolean
  toolingOptions: ToolingDataOption[]
  machineOptions: MachineEquipmentOption[]
  isMachineOptionsLoading: boolean
  initialValues?: ToolingStockOut | ToolingStockOutFormValues
  isAuditLocked?: boolean
  toolingInputMode?: 'select' | 'bottom-sheet'
  defaultValues?: Partial<ToolingStockOutFormValues>
}

const DEFAULT_VALUES: ToolingStockOutFormFields = {
  tooling_data_id: '',
  machine_equipment_id: '',
  recipient: '',
  purpose: '',
  stock_out_date: null,
  status: '待审核',
  stock_out_quantity: 0,
  collection_method: '新领取',
  remarks: '',
}

const NO_MACHINE_OPTION = {
  value: '',
  label: '无',
}

export default function ToolingStockOutForm({
  onFinish,
  setFormRef,
  isSubmitting,
  toolingOptions,
  machineOptions,
  isMachineOptionsLoading,
  initialValues,
  isAuditLocked = false,
  toolingInputMode = 'select',
  defaultValues,
}: Props) {
  const [form] = Form.useForm<ToolingStockOutFormFields>()
  const [isToolingSheetOpen, setIsToolingSheetOpen] = useState(false)
  const [isMachineSheetOpen, setIsMachineSheetOpen] = useState(false)
  const selectedToolingId = Form.useWatch('tooling_data_id', form)
  const selectedMachineId = Form.useWatch('machine_equipment_id', form)

  const selectedTooling = useMemo(
    () => toolingOptions.find((item) => item.id === selectedToolingId),
    [toolingOptions, selectedToolingId],
  )

  const toolingSelectOptions = useMemo(
    () =>
      toolingOptions.map((item) => ({
        value: item.id,
        label: `${item.tool_code} | ${item.tool_name} | ${item.tool_spec}`,
        keywords: buildToolingOptionKeywords([
          item.tool_code,
          item.tool_name,
          item.tool_spec,
          item.material,
        ]),
      })),
    [toolingOptions],
  )

  const toolingSheetOptions = useMemo<MobileBottomSelectOption[]>(
    () =>
      toolingOptions.map((item) => ({
        value: item.id,
        label: `${item.tool_code} | ${item.tool_name}`,
        description: (
          <div className="space-y-1">
            <div>规格：{item.tool_spec || '-'}</div>
            <div>材质：{item.material || '-'}</div>
          </div>
        ),
        keywords: buildToolingOptionKeywords([
          item.tool_code,
          item.tool_name,
          item.tool_spec,
          item.material,
        ]),
      })),
    [toolingOptions],
  )

  const currentToolingLabel = selectedTooling
    ? `${selectedTooling.tool_code} | ${selectedTooling.tool_name}`
    : ''

  const machineSelectOptions = useMemo(
    () =>
      [
        NO_MACHINE_OPTION,
        ...machineOptions.map((item) => ({
          value: item.id,
          label: `${item.unified_device_no} | ${item.machine_name}`,
        })),
      ],
    [machineOptions],
  )

  const machineSheetOptions = useMemo<MobileBottomSelectOption[]>(
    () =>
      [
        {
          value: '',
          label: '无',
          description: '不关联任何机器',
          keywords: '无 不关联 机器',
        },
        ...machineOptions.map((item) => ({
          value: item.id,
          label: item.unified_device_no,
          description: (
            <div className="space-y-1">
              <div>机器名称：{item.machine_name || '-'}</div>
              <div>工序：{item.operation || '-'}</div>
            </div>
          ),
          keywords: [
            item.unified_device_no,
            item.machine_name,
            item.operation,
          ].join(' '),
        })),
      ],
    [machineOptions],
  )

  const currentMachineLabel = useMemo(() => {
    if (selectedMachineId === '') {
      return NO_MACHINE_OPTION.label
    }

    const machine = machineOptions.find((item) => item.id === selectedMachineId)
    return machine
      ? `${machine.unified_device_no} | ${machine.machine_name}`
      : ''
  }, [machineOptions, selectedMachineId])

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...DEFAULT_VALUES,
        tooling_data_id: initialValues.tooling_data_id,
        machine_equipment_id: initialValues.machine_equipment_id || '',
        recipient: initialValues.recipient,
        purpose: initialValues.purpose,
        stock_out_date: initialValues.stock_out_date
          ? dayjs(initialValues.stock_out_date)
          : null,
        status: initialValues.status,
        stock_out_quantity: Number(initialValues.stock_out_quantity || 0),
        collection_method: initialValues.collection_method || '新领取',
        remarks: initialValues.remarks,
      })
      return
    }

    form.resetFields()
    form.setFieldsValue({
      ...DEFAULT_VALUES,
      ...defaultValues,
      machine_equipment_id: defaultValues?.machine_equipment_id || '',
      stock_out_date: defaultValues?.stock_out_date
        ? dayjs(defaultValues.stock_out_date)
        : DEFAULT_VALUES.stock_out_date,
    })
  }, [defaultValues, form, initialValues])

  const handleFinish = (values: ToolingStockOutFormFields) => {
    onFinish({
      tooling_data_id: values.tooling_data_id,
      machine_equipment_id: values.machine_equipment_id || null,
      recipient: values.recipient.trim(),
      purpose: values.purpose.trim(),
      stock_out_date: values.stock_out_date?.format('YYYY-MM-DD') || '',
      status: values.status,
      stock_out_quantity: Number(values.stock_out_quantity || 0),
      collection_method: values.collection_method || '新领取',
      remarks: values.remarks.trim(),
    })
  }

  return (
    <>
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
            title="当前记录已审核，仅允许修改备注。刀具、机器编号、领用信息、出库日期和出库数量已锁定；审核与反审请使用页面顶部按钮。"
          />
        )}

        <Form.Item
          name="tooling_data_id"
          label="关联刀具资料"
          rules={[{ required: true, message: '请选择刀具资料' }]}
        >
          {toolingInputMode === 'bottom-sheet' ? (
            <button
              type="button"
              disabled={
                isAuditLocked || isSubmitting || toolingOptions.length === 0
              }
              onClick={() => setIsToolingSheetOpen(true)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {currentToolingLabel ||
                (toolingOptions.length > 0
                  ? '请选择刀具资料'
                  : '暂无刀具资料，请先维护刀具资料')}
            </button>
          ) : (
            <Select
              disabled={isAuditLocked}
              showSearch={{
                filterOption: (input, option) =>
                  matchesToolingOptionKeyword(
                    input,
                    `${option?.label || ''} ${option?.keywords || ''}`,
                  ),
              }}
              placeholder={
                toolingOptions.length > 0
                  ? '请选择刀具资料'
                  : '暂无刀具资料，请先维护刀具资料'
              }
              options={toolingSelectOptions}
            />
          )}
        </Form.Item>

        <Form.Item
          name="machine_equipment_id"
          label="机器编号"
        >
          {toolingInputMode === 'bottom-sheet' ? (
            <button
              type="button"
              disabled={
                isAuditLocked || isSubmitting
              }
              onClick={() => setIsMachineSheetOpen(true)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {currentMachineLabel ||
                (machineOptions.length > 0
                  ? '请选择机器编号'
                  : '暂无机器资料，请先维护机器设备')}
            </button>
          ) : (
            <Select
              disabled={isAuditLocked}
              loading={isMachineOptionsLoading}
              showSearch={{
                filterOption: (input, option) =>
                  String(option?.label || '')
                    .toLowerCase()
                    .includes(input.toLowerCase()),
              }}
              placeholder={
                machineOptions.length > 0
                  ? '请选择机器编号'
                  : '暂无机器资料，请先维护机器设备'
              }
              options={machineSelectOptions}
            />
          )}
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
          {toolingInputMode === 'bottom-sheet' ? (
            <MobileNumberInput
              disabled={isAuditLocked}
              min={0.001}
              step={0.001}
              precision={3}
              keyboardMode="decimal"
              className="w-full"
              placeholder="请输入出库数量"
            />
          ) : (
            <InputNumber
              disabled={isAuditLocked}
              min={0.001}
              step={0.001}
              precision={3}
              style={{ width: '100%' }}
              placeholder="请输入出库数量"
            />
          )}
        </Form.Item>

        <Form.Item
          name="collection_method"
          label="领用方式"
          rules={[{ required: true, message: '请选择领用方式' }]}
        >
          <Select
            disabled={isAuditLocked}
            options={[
              { label: '新领取', value: '新领取' },
              { label: '以旧换新', value: '以旧换新' },
            ]}
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

      {toolingInputMode === 'bottom-sheet' ? (
        <MobileBottomSelectSheet
          open={isToolingSheetOpen}
          title="选择刀具资料"
          options={toolingSheetOptions}
          value={selectedToolingId}
          searchPlaceholder="输入刀具编号、名称、规格或材质搜索"
          emptyText="暂无可选刀具资料"
          onClose={() => setIsToolingSheetOpen(false)}
          onSelect={(value) => {
            form.setFieldValue('tooling_data_id', value)
          }}
        />
      ) : null}

      {toolingInputMode === 'bottom-sheet' ? (
        <MobileBottomSelectSheet
          open={isMachineSheetOpen}
          title="选择机器编号"
          options={machineSheetOptions}
          value={selectedMachineId}
          searchPlaceholder="输入机器编号、机器名称或工序搜索"
          emptyText="暂无可选机器编号"
          onClose={() => setIsMachineSheetOpen(false)}
          onSelect={(value) => {
            form.setFieldValue('machine_equipment_id', value)
          }}
        />
      ) : null}
    </>
  )
}
