import {
  Divider,
  Form,
  FormInstance,
  Input,
  InputNumber,
  Select,
  Typography,
} from 'antd'
import { useEffect, useMemo } from 'react'
import type {
  StandardTime,
  StandardTimeFormValues,
} from '@/services/apiStandardTimes'
import {
  useJobBaseSettingOptions,
  useMachineEquipmentMaintenanceOptions,
} from './useStandardTimes'

interface JobSelectOption {
  label: string
  value: string
  searchText: string
}

interface MachineEquipmentSelectOption {
  value: string
  operation: string
  machineName: string
  equipmentHourlyRate: number
  searchText: string
}

interface Props {
  onFinish: (values: StandardTimeFormValues) => void
  setFormRef: (form: FormInstance<StandardTimeFormValues>) => void
  isCreating: boolean
  isEdit: boolean
  initialValues?: StandardTimeFormValues | StandardTime
  mode?: 'admin' | 'team_leader'
}

const DEFAULT_VALUES: Omit<StandardTimeFormValues, 'operation' | 'model'> = {
  job_name: undefined,
  equipment_no: undefined,
  standard_seconds: 0,
  theoretical_seconds: 0,
  labor_rate: 0,
  equipment_rate: 0,
  tool_rate: 0,
  cutting_fluid_rate: 0,
  fixture_rate: 0,
  inspection_seconds: 0,
  daily_management_cost: 0,
  daily_total_hours: 0,
  remark: null,
}

function calculateCostPreview(values?: Partial<StandardTimeFormValues>) {
  const standardSeconds = Number(values?.standard_seconds || 0)
  const theoreticalSeconds = Number(values?.theoretical_seconds || 0)
  const laborRate = Number(values?.labor_rate || 0)
  const equipmentRate = Number(values?.equipment_rate || 0)
  const toolRate = Number(values?.tool_rate || 0)
  const cuttingFluidRate = Number(values?.cutting_fluid_rate || 0)
  const fixtureRate = Number(values?.fixture_rate || 0)
  const inspectionSeconds = Number(values?.inspection_seconds || 0)
  const dailyManagementCost = Number(values?.daily_management_cost || 0)
  const dailyTotalHours = Number(values?.daily_total_hours || 0)

  const laborCost = (standardSeconds * laborRate) / 3600
  const equipmentCost = (theoreticalSeconds * equipmentRate) / 3600
  const toolingConsumableCost = toolRate + cuttingFluidRate + fixtureRate
  const inspectionCost = (inspectionSeconds * laborRate) / 3600
  const overheadCost =
    dailyTotalHours > 0
      ? (dailyManagementCost * standardSeconds) / 3600 / dailyTotalHours
      : 0
  const totalCost =
    laborCost +
    equipmentCost +
    toolingConsumableCost +
    inspectionCost +
    overheadCost

  return {
    laborCost,
    equipmentCost,
    toolingConsumableCost,
    inspectionCost,
    overheadCost,
    totalCost,
  }
}

function formatMoney(value: number) {
  return value.toFixed(4)
}

export default function StandardTimeForm({
  onFinish,
  setFormRef,
  isCreating,
  isEdit,
  initialValues,
  mode = 'admin',
}: Props) {
  const [form] = Form.useForm<StandardTimeFormValues>()
  const isTeamLeaderMode = mode === 'team_leader'
  const { data: jobOptions = [], isLoading: isJobOptionsLoading } =
    useJobBaseSettingOptions()
  const { data: equipmentOptions = [], isLoading: isEquipmentOptionsLoading } =
    useMachineEquipmentMaintenanceOptions()
  const watchedValues = Form.useWatch([], form)
  const initialJobName = initialValues?.job_name || undefined
  const initialEquipmentNo = initialValues?.equipment_no || undefined
  const isJobNameRequired = !isEdit || Boolean(initialJobName)
  const isEquipmentNoRequired = !isEdit || Boolean(initialEquipmentNo)
  const jobSelectOptions = useMemo<JobSelectOption[]>(
    () =>
      jobOptions.map((option) => ({
        label: option.job_name,
        value: option.job_name,
        searchText: option.job_name.toLowerCase(),
      })),
    [jobOptions],
  )
  const machineEquipmentSelectOptions = useMemo<MachineEquipmentSelectOption[]>(
    () =>
      equipmentOptions.map((option) => ({
        value: option.unified_device_no,
        operation: option.operation,
        machineName: option.machine_name,
        equipmentHourlyRate: Number(option.equipment_hourly_rate || 0),
        searchText: [
          option.unified_device_no,
          option.operation,
          option.machine_name,
        ]
          .join(' ')
          .toLowerCase(),
      })),
    [equipmentOptions],
  )
  const jobRateMap = useMemo(
    () =>
      new Map(
        jobOptions.map((option) => [
          option.job_name,
          Number(option.hourly_fee || 0),
        ]),
      ),
    [jobOptions],
  )
  const equipmentRateMap = useMemo(
    () =>
      new Map(
        machineEquipmentSelectOptions.map((option) => [
          option.value,
          option.equipmentHourlyRate,
        ]),
      ),
    [machineEquipmentSelectOptions],
  )
  const costPreview = useMemo(
    () => calculateCostPreview(watchedValues),
    [watchedValues],
  )

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...DEFAULT_VALUES,
        ...initialValues,
      })
    } else {
      form.resetFields()
      form.setFieldsValue(DEFAULT_VALUES)
    }
  }, [form, initialValues])

  const handleJobChange = (value: string) => {
    const matchedRate = jobRateMap.get(value)
    if (matchedRate !== undefined) {
      form.setFieldValue('labor_rate', matchedRate)
    }
  }

  const handleEquipmentChange = (value: string | undefined) => {
    if (!value) {
      return
    }

    const matchedRate = equipmentRateMap.get(value)
    if (matchedRate !== undefined) {
      form.setFieldValue('equipment_rate', matchedRate)
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      disabled={isCreating}
    >
      <Form.Item
        name="model"
        label="型号"
        rules={[
          { required: true, message: '请输入型号' },
          { max: 100, message: '型号不能超过100个字符' },
        ]}
      >
        <Input
          placeholder="请输入型号"
          disabled={isCreating || (isTeamLeaderMode && isEdit)}
        />
      </Form.Item>
      <Form.Item
        name="operation"
        label="工序"
        rules={[
          { required: true, message: '请输入工序' },
          { max: 100, message: '工序不能超过100个字符' },
        ]}
      >
        <Input placeholder="请输入工序" disabled={isCreating} />
      </Form.Item>
      <Form.Item
        name="job_name"
        label="工种"
        rules={[
          { required: isJobNameRequired, message: '请选择工种' },
          { max: 50, message: '工种不能超过50个字符' },
        ]}
        extra={
          isTeamLeaderMode
            ? undefined
            : '选定工种后会自动带出人工费率，仍可手工修改'
        }
      >
        <Select
          allowClear={!isJobNameRequired}
          showSearch
          loading={isJobOptionsLoading}
          placeholder="请选择工种"
          optionFilterProp="label"
          options={jobSelectOptions}
          onChange={handleJobChange}
        />
      </Form.Item>
      <Form.Item
        name="equipment_no"
        label="设备编号"
        rules={[
          { required: isEquipmentNoRequired, message: '请选择设备编号' },
          { max: 50, message: '设备编号不能超过50个字符' },
        ]}
        extra={
          isTeamLeaderMode
            ? undefined
            : '选定设备编号后会自动带出设备费率，仍可手工修改'
        }
      >
        <Select
          allowClear={!isEquipmentNoRequired}
          showSearch
          loading={isEquipmentOptionsLoading}
          placeholder="请选择设备编号"
          optionFilterProp="label"
          filterOption={(input, option) =>
            String(option?.searchText || '')
              .toLowerCase()
              .includes(input.toLowerCase())
          }
          options={machineEquipmentSelectOptions.map((option) => ({
            label: option.value,
            value: option.value,
            searchText: option.searchText,
          }))}
          optionRender={(option) => {
            const matchedOption = machineEquipmentSelectOptions.find(
              (item) => item.value === option.data.value,
            )

            if (!matchedOption) {
              return option.data.label
            }

            return (
              <div className="py-1">
                <div className="font-medium text-slate-900">
                  {matchedOption.value}
                </div>
                <div className="text-xs text-slate-500">
                  {matchedOption.operation} / {matchedOption.machineName}
                </div>
              </div>
            )
          }}
          onChange={handleEquipmentChange}
        />
      </Form.Item>
      {isTeamLeaderMode ? null : (
        <>
          <Form.Item
            name="standard_seconds"
            label="标准工时（秒）"
            rules={[{ required: true, message: '请输入标准工时' }]}
          >
            <InputNumber
              placeholder="请输入标准工时"
              disabled={isCreating}
              min={0}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Divider>费率与管理参数</Divider>
          <Form.Item name="labor_rate" label="人工费率（元/小时）">
            <InputNumber min={0} step={0.0001} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="equipment_rate" label="设备费率（元/小时）">
            <InputNumber min={0} step={0.0001} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="tool_rate" label="刀具费率（元/支）">
            <InputNumber min={0} step={0.0001} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="cutting_fluid_rate" label="切削液费率（元/支）">
            <InputNumber min={0} step={0.0001} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="fixture_rate" label="工装费率（元/支）">
            <InputNumber min={0} step={0.0001} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="inspection_seconds" label="检验工时（秒）">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="daily_management_cost" label="日管理总费用（元）">
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="daily_total_hours" label="日总工时（小时）">
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
          <Divider>成本预览</Divider>
          <div className="grid grid-cols-1 gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-2">
            <div>
              <Typography.Text type="secondary">
                人工成本（元/支）
              </Typography.Text>
              <div className="mt-1 text-base font-semibold text-slate-900">
                {formatMoney(costPreview.laborCost)}
              </div>
            </div>
            <div>
              <Typography.Text type="secondary">
                设备成本（元/支）
              </Typography.Text>
              <div className="mt-1 text-base font-semibold text-slate-900">
                {formatMoney(costPreview.equipmentCost)}
              </div>
            </div>
            <div>
              <Typography.Text type="secondary">
                刀具辅料成本（元/支）
              </Typography.Text>
              <div className="mt-1 text-base font-semibold text-slate-900">
                {formatMoney(costPreview.toolingConsumableCost)}
              </div>
            </div>
            <div>
              <Typography.Text type="secondary">
                检验成本（元/支）
              </Typography.Text>
              <div className="mt-1 text-base font-semibold text-slate-900">
                {formatMoney(costPreview.inspectionCost)}
              </div>
            </div>
            <div>
              <Typography.Text type="secondary">
                单品分摊额（元/支）
              </Typography.Text>
              <div className="mt-1 text-base font-semibold text-slate-900">
                {formatMoney(costPreview.overheadCost)}
              </div>
            </div>
            <div>
              <Typography.Text type="secondary">合计（元/支）</Typography.Text>
              <div className="mt-1 text-base font-semibold text-slate-900">
                {formatMoney(costPreview.totalCost)}
              </div>
            </div>
          </div>
        </>
      )}
      <Form.Item
        name="theoretical_seconds"
        label="理论工时（秒）"
        rules={[{ required: true, message: '请输入理论工时' }]}
      >
        <InputNumber
          placeholder="请输入理论工时"
          disabled={isCreating}
          min={0}
          style={{ width: '100%' }}
        />
      </Form.Item>
    </Form>
  )
}
