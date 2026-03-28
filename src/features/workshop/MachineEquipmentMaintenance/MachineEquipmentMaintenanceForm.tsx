import { useEffect, useMemo } from 'react'
import { Card, Form, FormInstance, Input, InputNumber, Typography } from 'antd'

import type {
  MachineEquipmentMaintenance,
  MachineEquipmentMaintenanceFormValues,
} from '@/services/apiMachineEquipmentMaintenances'

const { TextArea } = Input

interface Props {
  onFinish: (values: MachineEquipmentMaintenanceFormValues) => void
  setFormRef: (
    form: FormInstance<MachineEquipmentMaintenanceFormValues>,
  ) => void
  isCreating: boolean
  initialValues?:
    | MachineEquipmentMaintenance
    | MachineEquipmentMaintenanceFormValues
}

const DEFAULT_VALUES: MachineEquipmentMaintenanceFormValues = {
  unified_device_no: '',
  operation: '',
  machine_name: '',
  original_no: '',
  power_kw: 0,
  sync_work_quantity: 1,
  electricity_unit_price: 0,
  machine_value: 0,
  depreciation_years: 1,
  annual_runtime_hours: 1,
  remark: '',
}

function formatAmount(value: number, digits = 4) {
  return value.toFixed(digits)
}

export default function MachineEquipmentMaintenanceForm({
  onFinish,
  setFormRef,
  isCreating,
  initialValues,
}: Props) {
  const [form] = Form.useForm<MachineEquipmentMaintenanceFormValues>()
  const watchedValues = Form.useWatch([], form)

  const preview = useMemo(() => {
    const powerKW = Number(watchedValues?.power_kw || 0)
    const syncWorkQuantity = Number(watchedValues?.sync_work_quantity || 0)
    const electricityUnitPrice = Number(
      watchedValues?.electricity_unit_price || 0,
    )
    const machineValue = Number(watchedValues?.machine_value || 0)
    const depreciationYears = Number(watchedValues?.depreciation_years || 0)
    const annualRuntimeHours = Number(watchedValues?.annual_runtime_hours || 0)
    const hourlyElectricityFee =
      syncWorkQuantity > 0
        ? (powerKW * electricityUnitPrice) / syncWorkQuantity
        : 0
    const depreciationRate =
      depreciationYears > 0 && annualRuntimeHours > 0
        ? machineValue / depreciationYears / annualRuntimeHours
        : 0

    return {
      hourlyElectricityFee,
      depreciationRate,
      equipmentHourlyRate: hourlyElectricityFee + depreciationRate,
    }
  }, [watchedValues])

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...DEFAULT_VALUES,
        unified_device_no: initialValues.unified_device_no,
        operation: initialValues.operation,
        machine_name: initialValues.machine_name,
        original_no: initialValues.original_no || '',
        power_kw: Number(initialValues.power_kw || 0),
        sync_work_quantity: Number(initialValues.sync_work_quantity || 1),
        electricity_unit_price: Number(
          initialValues.electricity_unit_price || 0,
        ),
        machine_value: Number(initialValues.machine_value || 0),
        depreciation_years: Number(initialValues.depreciation_years || 1),
        annual_runtime_hours: Number(initialValues.annual_runtime_hours || 1),
        remark: initialValues.remark || '',
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
      disabled={isCreating}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Form.Item
          name="unified_device_no"
          label="统一设备编号"
          rules={[
            { required: true, message: '请输入统一设备编号' },
            { max: 50, message: '统一设备编号不能超过 50 个字符' },
          ]}
        >
          <Input placeholder="例如：EQ-001" maxLength={50} />
        </Form.Item>

        <Form.Item
          name="operation"
          label="工序"
          rules={[
            { required: true, message: '请输入工序' },
            { max: 50, message: '工序不能超过 50 个字符' },
          ]}
        >
          <Input placeholder="例如：CNC 加工" maxLength={50} />
        </Form.Item>

        <Form.Item
          name="machine_name"
          label="机器名称"
          rules={[
            { required: true, message: '请输入机器名称' },
            { max: 100, message: '机器名称不能超过 100 个字符' },
          ]}
        >
          <Input placeholder="例如：数控车床" maxLength={100} />
        </Form.Item>

        <Form.Item
          name="original_no"
          label="原编号"
          rules={[{ max: 50, message: '原编号不能超过 50 个字符' }]}
        >
          <Input placeholder="请输入原编号" maxLength={50} />
        </Form.Item>

        <Form.Item
          name="power_kw"
          label="功率（kW）"
          rules={[{ required: true, message: '请输入功率' }]}
        >
          <InputNumber
            min={0}
            step={0.1}
            precision={2}
            style={{ width: '100%' }}
            placeholder="请输入功率"
          />
        </Form.Item>

        <Form.Item
          name="sync_work_quantity"
          label="同步工作数量"
          rules={[{ required: true, message: '请输入同步工作数量' }]}
        >
          <InputNumber
            min={1}
            step={1}
            precision={0}
            style={{ width: '100%' }}
            placeholder="请输入同步工作数量"
          />
        </Form.Item>

        <Form.Item
          name="electricity_unit_price"
          label="电单价（元/度）"
          rules={[{ required: true, message: '请输入电单价' }]}
        >
          <InputNumber
            min={0}
            step={0.0001}
            precision={4}
            style={{ width: '100%' }}
            placeholder="请输入电单价"
          />
        </Form.Item>

        <Form.Item
          name="machine_value"
          label="机器价值（元）"
          rules={[{ required: true, message: '请输入机器价值' }]}
        >
          <InputNumber
            min={0}
            step={100}
            precision={2}
            style={{ width: '100%' }}
            placeholder="请输入机器价值"
          />
        </Form.Item>

        <Form.Item
          name="depreciation_years"
          label="折旧年份"
          rules={[{ required: true, message: '请输入折旧年份' }]}
        >
          <InputNumber
            min={1}
            step={1}
            precision={0}
            style={{ width: '100%' }}
            placeholder="请输入折旧年份"
          />
        </Form.Item>

        <Form.Item
          name="annual_runtime_hours"
          label="年运行时长（小时）"
          rules={[{ required: true, message: '请输入年运行时长' }]}
        >
          <InputNumber
            min={0.01}
            step={1}
            precision={2}
            style={{ width: '100%' }}
            placeholder="请输入年运行时长"
          />
        </Form.Item>
      </div>

      <Form.Item name="remark" label="备注">
        <TextArea rows={3} placeholder="请输入备注" maxLength={500} />
      </Form.Item>

      <Card size="small" className="border-slate-200 bg-slate-50">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Typography.Text type="secondary">单小时电费（元）</Typography.Text>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              {formatAmount(preview.hourlyElectricityFee, 8)}
            </div>
          </div>
          <div>
            <Typography.Text type="secondary">
              折旧费率（元/小时）
            </Typography.Text>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              {formatAmount(preview.depreciationRate, 8)}
            </div>
          </div>
          <div>
            <Typography.Text type="secondary">
              设备小时费率（元/小时）
            </Typography.Text>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              {formatAmount(preview.equipmentHourlyRate, 8)}
            </div>
          </div>
        </div>
      </Card>
    </Form>
  )
}
