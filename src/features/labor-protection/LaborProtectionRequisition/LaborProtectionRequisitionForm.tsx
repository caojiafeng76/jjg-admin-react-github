import { useEffect, useMemo, useState } from 'react'
import { Form, type FormInstance, Input, InputNumber, Select } from 'antd'

import type { LaborProtectionDataOption } from '@/services/apiLaborProtectionData'
import type {
  LaborProtectionRequisition,
  LaborProtectionRequisitionFormValues,
} from '@/services/apiLaborProtectionRequisitions'
import type { MachineEquipmentOption } from '@/services/apiMachineEquipmentMaintenances'
import MobileBottomSelectSheet, {
  type MobileBottomSelectOption,
} from '@/ui/mobile/MobileBottomSelectSheet'
import MobileNumberInput from '@/ui/mobile/MobileNumberInput'

interface Props {
  onFinish: (values: LaborProtectionRequisitionFormValues) => void
  setFormRef: (form: FormInstance<LaborProtectionRequisitionFormValues>) => void
  isSubmitting: boolean
  categoryOptions: LaborProtectionDataOption[]
  isCategoryOptionsLoading: boolean
  machineOptions: MachineEquipmentOption[]
  isMachineOptionsLoading: boolean
  categoryInputMode?: 'select' | 'bottom-sheet'
  machineInputMode?: 'select' | 'bottom-sheet'
  initialValues?:
    | LaborProtectionRequisition
    | LaborProtectionRequisitionFormValues
}

const DEFAULT_VALUES: LaborProtectionRequisitionFormValues = {
  labor_protection_data_id: '',
  machine_equipment_id: '',
  job_title: '',
  quantity: 1,
  recipient: '',
  collection_method: '新领取',
}

const NO_MACHINE_OPTION = {
  value: '',
  label: '无',
}

export default function LaborProtectionRequisitionForm({
  onFinish,
  setFormRef,
  isSubmitting,
  categoryOptions,
  isCategoryOptionsLoading,
  machineOptions,
  isMachineOptionsLoading,
  categoryInputMode = 'select',
  machineInputMode = 'select',
  initialValues,
}: Props) {
  const [form] = Form.useForm<LaborProtectionRequisitionFormValues>()
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false)
  const [isMachineSheetOpen, setIsMachineSheetOpen] = useState(false)
  const currentCategoryId = Form.useWatch('labor_protection_data_id', form)
  const currentMachineId = Form.useWatch('machine_equipment_id', form)

  const categorySelectOptions = useMemo(
    () =>
      categoryOptions.map((item) => ({
        value: item.id,
        label: item.category,
      })),
    [categoryOptions],
  )

  const categorySheetOptions = useMemo<MobileBottomSelectOption[]>(
    () =>
      categoryOptions.map((item) => ({
        value: item.id,
        label: item.category,
        keywords: item.category,
      })),
    [categoryOptions],
  )

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

  const currentCategoryLabel = useMemo(
    () =>
      categoryOptions.find((item) => item.id === currentCategoryId)?.category,
    [categoryOptions, currentCategoryId],
  )

  const currentMachineLabel = useMemo(() => {
    if (currentMachineId === '') {
      return NO_MACHINE_OPTION.label
    }

    const machine = machineOptions.find((item) => item.id === currentMachineId)
    return machine
      ? `${machine.unified_device_no} | ${machine.machine_name}`
      : ''
  }, [currentMachineId, machineOptions])

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...DEFAULT_VALUES,
        labor_protection_data_id: initialValues.labor_protection_data_id,
        machine_equipment_id: initialValues.machine_equipment_id || '',
        job_title: initialValues.job_title,
        quantity: Number(initialValues.quantity || 1),
        recipient: initialValues.recipient,
        collection_method: initialValues.collection_method || '新领取',
      })
      return
    }

    form.resetFields()
    form.setFieldsValue(DEFAULT_VALUES)
  }, [form, initialValues])

  return (
    <>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        disabled={isSubmitting}
      >
        <Form.Item
          name="labor_protection_data_id"
          label="种类"
          rules={[{ required: true, message: '请选择劳保种类' }]}
        >
          {categoryInputMode === 'bottom-sheet' ? (
            <button
              type="button"
              disabled={isSubmitting || categoryOptions.length === 0}
              onClick={() => setIsCategorySheetOpen(true)}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-left text-sm font-medium text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {currentCategoryLabel ||
                (categoryOptions.length > 0
                  ? '请选择劳保种类'
                  : '暂无劳保资料，请先维护劳保资料')}
            </button>
          ) : (
            <Select
              loading={isCategoryOptionsLoading}
              showSearch={{
                filterOption: (input, option) =>
                  String(option?.label || '')
                    .toLowerCase()
                    .includes(input.toLowerCase()),
              }}
              placeholder={
                categoryOptions.length > 0
                  ? '请选择劳保种类'
                  : '暂无劳保资料，请先维护劳保资料'
              }
              options={categorySelectOptions}
            />
          )}
        </Form.Item>

        <Form.Item
          name="machine_equipment_id"
          label="机器编号"
        >
          {machineInputMode === 'bottom-sheet' ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsMachineSheetOpen(true)}
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-left text-sm font-medium text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {currentMachineLabel ||
                (machineOptions.length > 0
                  ? '请选择机器编号'
                  : '暂无机器资料，请先维护机器设备')}
            </button>
          ) : (
            <Select
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Form.Item
            name="job_title"
            label="岗位"
            rules={[{ required: true, message: '请输入岗位' }]}
          >
            <Input placeholder="请输入岗位" maxLength={100} />
          </Form.Item>

          <Form.Item
            name="quantity"
            label="数量"
            rules={[
              { required: true, message: '请输入数量' },
              {
                validator: async (_rule, value) => {
                  if (Number.isInteger(Number(value)) && Number(value) > 0) {
                    return
                  }

                  throw new Error('数量必须为大于 0 的整数')
                },
              },
            ]}
          >
            {categoryInputMode === 'bottom-sheet' ? (
              <MobileNumberInput
                min={1}
                precision={0}
                step={1}
                keyboardMode="numeric"
                className="w-full"
                placeholder="请输入数量"
              />
            ) : (
              <InputNumber
                min={1}
                precision={0}
                step={1}
                style={{ width: '100%' }}
                placeholder="请输入数量"
              />
            )}
          </Form.Item>
        </div>

        <Form.Item
          name="recipient"
          label="领取人"
          rules={[{ required: true, message: '请输入领取人' }]}
        >
          <Input placeholder="请输入领取人" maxLength={100} />
        </Form.Item>

        <Form.Item
          name="collection_method"
          label="领用方式"
          rules={[{ required: true, message: '请选择领用方式' }]}
        >
          <Select
            options={[
              { label: '新领取', value: '新领取' },
              { label: '以旧换新', value: '以旧换新' },
            ]}
          />
        </Form.Item>
      </Form>

      {categoryInputMode === 'bottom-sheet' ? (
        <MobileBottomSelectSheet
          open={isCategorySheetOpen}
          title="选择劳保种类"
          options={categorySheetOptions}
          value={currentCategoryId}
          searchPlaceholder="输入种类名称搜索"
          emptyText="暂无可选劳保种类"
          onClose={() => setIsCategorySheetOpen(false)}
          onSelect={(value) => {
            form.setFieldValue('labor_protection_data_id', value)
          }}
        />
      ) : null}

      {machineInputMode === 'bottom-sheet' ? (
        <MobileBottomSelectSheet
          open={isMachineSheetOpen}
          title="选择机器编号"
          options={machineSheetOptions}
          value={currentMachineId}
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
