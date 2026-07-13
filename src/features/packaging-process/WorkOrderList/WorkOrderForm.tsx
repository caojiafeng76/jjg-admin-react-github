import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  App,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
  type FormInstance,
} from 'antd'
import dayjs from 'dayjs'

import type {
  PackagingWorkOrder,
  PackagingWorkOrderBatch,
  PackagingWorkOrderFormValues,
} from '@/services/apiPackagingWorkOrders'
import {
  getSalesOrderByProjectNo,
  getStandardSecondsByPartNo,
} from '@/services/apiPackagingWorkOrders'
import {
  mergeEmployeeSelectOptions,
  rememberEmployeeOptions,
  toEmployeeSelectOption,
  type EmployeeSelectOption,
} from './employeeSelectOptions'
import {
  usePackagingSalesOrdersProjectNos,
  usePackagingEmployeeOptions,
} from './useWorkOrders'

interface Props {
  onFinish: (values: PackagingWorkOrderFormValues) => void
  setFormRef: (form: FormInstance<PackagingWorkOrderFormValues>) => void
  isSubmitting: boolean
  initialValues?:
    | PackagingWorkOrder
    | PackagingWorkOrderBatch
    | PackagingWorkOrderFormValues
  isHistoricalInconsistent?: boolean
}

interface WorkOrderFormValues {
  work_date: dayjs.Dayjs
  employee_id: string | null
  employee_ids: string[]
  project_no: string | null
  product_model: string
  color_name: string | null
  process_name: string | null
  length_mm: number | null
  part_no: string | null
  weight_per_meter_kg: number
  unit: string
  quantity: number
  defective_quantity: number
  defect_reason: string | null
  standard_seconds: number
  extra_qualified_hours: number
  remark: string | null
}

const UNIT_OPTIONS = [
  { label: '支', value: '支' },
  { label: '千克', value: '千克' },
]

const EMPTY_EMPLOYEE_IDS: string[] = []

const DEFAULT_FORM_VALUES: WorkOrderFormValues = {
  work_date: dayjs(),
  employee_id: null,
  employee_ids: [],
  project_no: null,
  product_model: '',
  color_name: null,
  process_name: null,
  length_mm: null,
  part_no: null,
  weight_per_meter_kg: 0,
  unit: '支',
  quantity: 0,
  defective_quantity: 0,
  defect_reason: null,
  standard_seconds: 0,
  extra_qualified_hours: 0,
  remark: null,
}

function getInitialEmployeeSnapshots(
  initialValues: Props['initialValues'],
): EmployeeSelectOption[] {
  if (!initialValues) return []

  if (
    'employee_ids' in initialValues &&
    Array.isArray(initialValues.employee_ids) &&
    'employee_names' in initialValues &&
    Array.isArray(initialValues.employee_names)
  ) {
    return initialValues.employee_ids.flatMap((employeeId, index) => {
      const employeeName = initialValues.employee_names[index]
      return employeeName ? [{ label: employeeName, value: employeeId }] : []
    })
  }

  const employeeName =
    'employee_name' in initialValues ? initialValues.employee_name : undefined

  return initialValues.employee_id && employeeName
    ? [{ label: employeeName, value: initialValues.employee_id }]
    : []
}

function FormSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-slate-50/50 p-3">
      <div className="mb-3 text-sm font-medium text-slate-700">{title}</div>
      <div className="grid grid-cols-1 gap-x-3 md:grid-cols-2">{children}</div>
    </section>
  )
}

export default function WorkOrderForm({
  onFinish,
  setFormRef,
  isSubmitting,
  initialValues,
  isHistoricalInconsistent = false,
}: Props) {
  const [form] = Form.useForm<WorkOrderFormValues>()
  const { message } = App.useApp()
  const [projectNoValue, setProjectNoValue] = useState<string | undefined>(
    undefined,
  )
  const [employeeKeyword, setEmployeeKeyword] = useState('')
  const deferredEmployeeKeyword = useDeferredValue(employeeKeyword)
  const [selectedEmployeeSnapshots, setSelectedEmployeeSnapshots] = useState<
    EmployeeSelectOption[]
  >([])
  const employeeIds = Form.useWatch('employee_ids', form) ?? EMPTY_EMPLOYEE_IDS

  const { data: projectNoOptions = [] } = usePackagingSalesOrdersProjectNos()
  const { data: employeeOptions, isFetching: isEmployeeOptionsFetching } =
    usePackagingEmployeeOptions(deferredEmployeeKeyword)

  const projectNoSelectOptions = useMemo(
    () =>
      projectNoOptions.map((option) => ({
        label: (
          <div className="flex flex-col py-1 leading-5">
            <span className="font-medium">{option.project_no}</span>
            <span className="text-xs text-slate-500">
              型号：{option.product_model || '-'} / 长度：
              {option.length_mm ?? '-'}
            </span>
          </div>
        ),
        value: option.project_no,
        searchText: [option.project_no, option.product_model, option.length_mm]
          .filter((value) => value !== null && value !== undefined)
          .join(' ')
          .toLowerCase(),
      })),
    [projectNoOptions],
  )

  const employeeSelectOptions = useMemo(
    () =>
      mergeEmployeeSelectOptions(
        employeeOptions?.items ?? [],
        selectedEmployeeSnapshots,
        employeeIds,
      ),
    [employeeIds, employeeOptions, selectedEmployeeSnapshots],
  )

  useEffect(() => {
    const selectedEmployeeIdSet = new Set(employeeIds)
    const selectedOptions = (employeeOptions?.items ?? [])
      .filter(({ id }) => selectedEmployeeIdSet.has(id))
      .map(toEmployeeSelectOption)

    if (selectedOptions.length === 0) return

    setSelectedEmployeeSnapshots((previous) =>
      rememberEmployeeOptions(previous, selectedOptions),
    )
  }, [employeeIds, employeeOptions])

  useEffect(() => {
    setFormRef(form as unknown as FormInstance<PackagingWorkOrderFormValues>)
  }, [form, setFormRef])

  useEffect(() => {
    setEmployeeKeyword('')
    setSelectedEmployeeSnapshots(getInitialEmployeeSnapshots(initialValues))

    if (initialValues) {
      const workDate = initialValues.work_date
        ? dayjs(initialValues.work_date)
        : dayjs()

      form.setFieldsValue({
        ...DEFAULT_FORM_VALUES,
        work_date: workDate,
        employee_id: initialValues.employee_id,
        employee_ids:
          'employee_ids' in initialValues && initialValues.employee_ids
            ? initialValues.employee_ids
            : initialValues.employee_id
              ? [initialValues.employee_id]
              : [],
        project_no: initialValues.project_no,
        product_model: initialValues.product_model,
        color_name: initialValues.color_name,
        process_name: initialValues.process_name,
        length_mm: initialValues.length_mm,
        part_no: initialValues.part_no,
        weight_per_meter_kg: initialValues.weight_per_meter_kg ?? 0,
        unit: initialValues.unit || '支',
        quantity: initialValues.quantity,
        defective_quantity: initialValues.defective_quantity ?? 0,
        defect_reason: initialValues.defect_reason ?? null,
        standard_seconds: initialValues.standard_seconds,
        extra_qualified_hours: initialValues.extra_qualified_hours ?? 0,
        remark: initialValues.remark,
      })
      setProjectNoValue(initialValues.project_no || undefined)
      return
    }

    form.resetFields()
    form.setFieldsValue({ ...DEFAULT_FORM_VALUES })
    setProjectNoValue(undefined)
  }, [form, initialValues])

  const handleProjectNoChange = useCallback(
    async (projectNo: string | undefined) => {
      setProjectNoValue(projectNo)
      if (!projectNo) {
        form.setFieldsValue({
          project_no: null,
          product_model: '',
          color_name: null,
          length_mm: null,
          part_no: null,
          weight_per_meter_kg: 0,
          standard_seconds: 0,
        })
        return
      }

      try {
        const orderInfo = await getSalesOrderByProjectNo(projectNo)
        const standardSeconds = await getStandardSecondsByPartNo(
          orderInfo.material_code,
          orderInfo.product_model,
        )

        form.setFieldsValue({
          project_no: orderInfo.project_no,
          product_model: orderInfo.product_model ?? '',
          color_name: orderInfo.color_name ?? null,
          length_mm: orderInfo.length_mm ?? null,
          part_no: orderInfo.material_code ?? null,
          weight_per_meter_kg: orderInfo.weight_per_meter_kg ?? 0,
          standard_seconds: standardSeconds,
        })
      } catch {
        message.warning('项目号信息获取失败，请手动填写')
      }
    },
    [form, message],
  )

  const quantity = Form.useWatch('quantity', form) || 0
  const defectiveQuantity = Form.useWatch('defective_quantity', form) || 0
  const lengthMm = Form.useWatch('length_mm', form) || 0
  const weightPerMeterKg = Form.useWatch('weight_per_meter_kg', form) || 0
  const standardSeconds = Form.useWatch('standard_seconds', form) || 0
  const employeeCount = employeeIds.length || 1
  const averageQuantity = useMemo(() => {
    const q = Number(quantity) || 0
    return (Math.round((q / employeeCount) * 10) / 10).toFixed(1)
  }, [employeeCount, quantity])
  const workHours = useMemo(() => {
    const q = Number(averageQuantity) || 0
    const s = Number(standardSeconds) || 0
    return ((q * s) / 3600).toFixed(2)
  }, [averageQuantity, standardSeconds])
  const defectiveWeightKg = useMemo(() => {
    const defectiveCount = Number(defectiveQuantity) || 0
    const length = Number(lengthMm) || 0
    const meterWeight = Number(weightPerMeterKg) || 0
    return ((defectiveCount * length * meterWeight) / 1000).toFixed(2)
  }, [defectiveQuantity, lengthMm, weightPerMeterKg])

  const handleFinish = useCallback(
    (values: WorkOrderFormValues) => {
      const formValues: PackagingWorkOrderFormValues = {
        work_date: values.work_date.format('YYYY-MM-DD'),
        employee_id: values.employee_ids[0] || values.employee_id || null,
        employee_ids: values.employee_ids,
        project_no: values.project_no,
        product_model: values.product_model,
        color_name: values.color_name,
        process_name: values.process_name,
        length_mm: values.length_mm,
        part_no: values.part_no,
        weight_per_meter_kg: values.weight_per_meter_kg,
        unit: values.unit,
        quantity: values.quantity,
        defective_quantity: values.defective_quantity,
        defect_reason: values.defect_reason,
        standard_seconds: values.standard_seconds,
        extra_qualified_hours: values.extra_qualified_hours,
        remark: values.remark,
      }
      onFinish(formValues)
    },
    [onFinish],
  )

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      disabled={isSubmitting}
    >
      <div className="flex flex-col gap-4">
        <FormSection title="基础信息">
          <Form.Item
            name="work_date"
            label="日期"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker className="w-full" />
          </Form.Item>

          <Form.Item
            name="employee_ids"
            label="人员"
            rules={[{ required: true, message: '请选择人员' }]}
          >
            <Select
              allowClear
              mode="multiple"
              maxCount={isHistoricalInconsistent ? 1 : undefined}
              showSearch={{
                filterOption: false,
                onSearch: setEmployeeKeyword,
              }}
              loading={isEmployeeOptionsFetching}
              onClear={() => setEmployeeKeyword('')}
              onSelect={(_, option) => {
                if (typeof option.label !== 'string') return

                setSelectedEmployeeSnapshots((previous) =>
                  rememberEmployeeOptions(previous, [
                    { label: option.label, value: String(option.value) },
                  ]),
                )
              }}
              placeholder="请选择人员"
              options={employeeSelectOptions}
            />
          </Form.Item>

          <Form.Item name="project_no" label="项目号" className="md:col-span-2">
            <Select
              allowClear
              showSearch={{
                filterOption: (input, option) =>
                  String(option?.searchText || '')
                    .toLowerCase()
                    .includes(input.trim().toLowerCase()),
              }}
              placeholder="请选择或搜索项目号"
              value={projectNoValue}
              onChange={handleProjectNoChange}
              optionLabelProp="value"
              options={projectNoSelectOptions}
            />
          </Form.Item>
        </FormSection>

        <FormSection title="产品信息">
          <Form.Item
            name="product_model"
            label="型号"
            rules={[{ required: true, message: '请输入型号' }]}
          >
            <Input placeholder="请输入型号" allowClear />
          </Form.Item>

          <Form.Item name="color_name" label="颜色">
            <Input placeholder="请输入颜色" allowClear />
          </Form.Item>

          <Form.Item name="process_name" label="工艺">
            <Input placeholder="请输入工艺" allowClear />
          </Form.Item>

          <Form.Item name="length_mm" label="长度(mm)">
            <InputNumber
              min={0}
              step={0.01}
              className="w-full"
              placeholder="请输入长度"
            />
          </Form.Item>

          <Form.Item name="part_no" label="料号">
            <Input placeholder="请输入料号" allowClear />
          </Form.Item>

          <Form.Item name="weight_per_meter_kg" label="米重(kg/m)">
            <InputNumber
              min={0}
              step={0.0001}
              precision={4}
              className="w-full"
              placeholder="请输入米重"
            />
          </Form.Item>
        </FormSection>

        <FormSection title="工时产量">
          <Form.Item
            name="unit"
            label="单位"
            rules={[{ required: true, message: '请选择单位' }]}
            initialValue="支"
          >
            <Select placeholder="请选择单位" options={UNIT_OPTIONS} />
          </Form.Item>

          <Form.Item
            name="quantity"
            label="总数量"
            rules={[{ required: true, message: '请输入数量' }]}
          >
            <InputNumber
              min={0}
              step={1}
              className="w-full"
              placeholder="请输入数量"
            />
          </Form.Item>

          <Form.Item name="defective_quantity" label="不良数量">
            <InputNumber
              min={0}
              step={1}
              className="w-full"
              placeholder="请输入不良数量"
            />
          </Form.Item>

          <Form.Item label="不良重量(kg)">
            <Input disabled value={defectiveWeightKg} />
          </Form.Item>

          <Form.Item
            name="defect_reason"
            label="不良原因"
            className="md:col-span-2"
          >
            <Input.TextArea rows={3} placeholder="请输入不良原因" />
          </Form.Item>

          <Form.Item label="人均产量">
            <Input disabled value={averageQuantity} />
          </Form.Item>

          <Form.Item
            name="standard_seconds"
            label="标准工时（秒）"
            rules={[{ required: true, message: '请输入标准工时' }]}
          >
            <InputNumber
              min={0}
              step={1}
              className="w-full"
              placeholder="请输入标准工时"
            />
          </Form.Item>

          <Form.Item name="extra_qualified_hours" label="零工（小时）">
            <InputNumber
              min={0}
              step={0.5}
              precision={2}
              className="w-full"
              placeholder="例如 1.5"
            />
          </Form.Item>

          <Form.Item label="人均时间（小时）">
            <Input disabled value={workHours} />
          </Form.Item>
        </FormSection>

        <FormSection title="备注">
          <Form.Item name="remark" label="备注" className="md:col-span-2">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </FormSection>
      </div>
    </Form>
  )
}
