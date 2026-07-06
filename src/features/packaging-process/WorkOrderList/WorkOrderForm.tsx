import { useCallback, useEffect, useMemo, useState } from 'react'
import { App, DatePicker, Form, Input, InputNumber, Select, type FormInstance } from 'antd'
import dayjs from 'dayjs'

import type { PackagingWorkOrder, PackagingWorkOrderFormValues } from '@/services/apiPackagingWorkOrders'
import { getSalesOrderByProjectNo, getStandardSecondsByPartNo } from '@/services/apiPackagingWorkOrders'
import {
  usePackagingSalesOrdersProjectNos,
  usePackagingEmployeeOptions,
} from './useWorkOrders'

interface Props {
  onFinish: (values: PackagingWorkOrderFormValues) => void
  setFormRef: (form: FormInstance<PackagingWorkOrderFormValues>) => void
  isSubmitting: boolean
  initialValues?: PackagingWorkOrder | PackagingWorkOrderFormValues
}

const DEFAULT_VALUES: PackagingWorkOrderFormValues = {
  work_date: dayjs().format('YYYY-MM-DD'),
  employee_id: null,
  project_no: null,
  product_model: '',
  color_name: null,
  process_name: null,
  length_mm: null,
  part_no: null,
  unit: '支',
  quantity: 0,
  standard_seconds: 0,
  remark: null,
}

export default function WorkOrderForm({
  onFinish,
  setFormRef,
  isSubmitting,
  initialValues,
}: Props) {
  const [form] = Form.useForm<PackagingWorkOrderFormValues>()
  const { message } = App.useApp()
  const [projectNoValue, setProjectNoValue] = useState<string | undefined>(
    undefined,
  )

  const { data: projectNoOptions = [] } = usePackagingSalesOrdersProjectNos()
  const { data: employeeOptions = [] } = usePackagingEmployeeOptions()

  const projectNoSelectOptions = useMemo(
    () =>
      projectNoOptions.map((option) => ({
        label: option.project_no,
        value: option.project_no,
        searchText: option.project_no.toLowerCase(),
      })),
    [projectNoOptions],
  )

  const employeeSelectOptions = useMemo(
    () =>
      employeeOptions.items.map((employee) => ({
        label: employee.name,
        value: employee.id,
      })),
    [employeeOptions],
  )

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    if (initialValues) {
      const workDate = initialValues.work_date
        ? dayjs(initialValues.work_date)
        : dayjs()

      form.setFieldsValue({
        ...DEFAULT_VALUES,
        work_date: workDate,
        employee_id: initialValues.employee_id,
        project_no: initialValues.project_no,
        product_model: initialValues.product_model,
        color_name: initialValues.color_name,
        process_name: initialValues.process_name,
        length_mm: initialValues.length_mm,
        part_no: initialValues.part_no,
        unit: initialValues.unit || '支',
        quantity: initialValues.quantity,
        standard_seconds: initialValues.standard_seconds,
        remark: initialValues.remark,
      })
      setProjectNoValue(initialValues.project_no || undefined)
      return
    }

    form.resetFields()
    form.setFieldsValue({
      ...DEFAULT_VALUES,
      work_date: dayjs(),
    })
    setProjectNoValue(undefined)
  }, [form, initialValues])

  const handleProjectNoChange = useCallback(
    async (projectNo: string | undefined) => {
      setProjectNoValue(projectNo)
      if (!projectNo) {
        form.setFieldsValue({
          product_model: '',
          color_name: null,
          length_mm: null,
          part_no: null,
          standard_seconds: 0,
        })
        return
      }

      try {
        const orderInfo = await getSalesOrderByProjectNo(projectNo)
        const standardSeconds = await getStandardSecondsByPartNo(
          orderInfo.material_code,
        )

        form.setFieldsValue({
          product_model: orderInfo.product_model ?? '',
          color_name: orderInfo.color_name ?? null,
          length_mm: orderInfo.length_mm ?? null,
          part_no: orderInfo.material_code ?? null,
          standard_seconds,
        })
      } catch (error) {
        message.warning('项目号信息获取失败，请手动填写')
      }
    },
    [form, message],
  )

  const quantity = Form.useWatch('quantity', form) || 0
  const standardSeconds = Form.useWatch('standard_seconds', form) || 0
  const workHours = useMemo(() => {
    const q = Number(quantity) || 0
    const s = Number(standardSeconds) || 0
    return ((q * s) / 3600).toFixed(2)
  }, [quantity, standardSeconds])

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      disabled={isSubmitting}
    >
      <div className="grid grid-cols-2 gap-3">
        <Form.Item
          name="work_date"
          label="日期"
          rules={[{ required: true, message: '请选择日期' }]}
        >
          <DatePicker className="w-full" />
        </Form.Item>

        <Form.Item
          name="employee_id"
          label="人员"
          rules={[{ required: true, message: '请选择人员' }]}
        >
          <Select
            allowClear
            showSearch
            placeholder="请选择人员"
            optionFilterProp="label"
            options={employeeSelectOptions}
          />
        </Form.Item>

        <Form.Item label="项目号" className="col-span-2">
          <Select
            allowClear
            showSearch
            placeholder="请选择或搜索项目号"
            value={projectNoValue}
            onChange={handleProjectNoChange}
            filterOption={(input, option) =>
              String(option?.searchText || '')
                .toLowerCase()
                .includes(input.trim().toLowerCase())
            }
            options={projectNoSelectOptions}
          />
        </Form.Item>

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
          <InputNumber min={0} step={0.01} className="w-full" placeholder="请输入长度" />
        </Form.Item>

        <Form.Item name="part_no" label="料号">
          <Input placeholder="请输入料号" allowClear />
        </Form.Item>

        <Form.Item
          name="unit"
          label="单位"
          rules={[{ required: true, message: '请输入单位' }]}
          initialValue="支"
        >
          <Input placeholder="单位" />
        </Form.Item>

        <Form.Item
          name="quantity"
          label="数量"
          rules={[{ required: true, message: '请输入数量' }]}
        >
          <InputNumber min={0} step={1} className="w-full" placeholder="请输入数量" />
        </Form.Item>

        <Form.Item
          name="standard_seconds"
          label="标准工时（秒）"
          rules={[{ required: true, message: '请输入标准工时' }]}
        >
          <InputNumber min={0} step={1} className="w-full" placeholder="请输入标准工时" />
        </Form.Item>

        <Form.Item label="时间（小时）">
          <Input disabled value={workHours} />
        </Form.Item>

        <Form.Item name="remark" label="备注" className="col-span-2">
          <Input.TextArea rows={3} placeholder="请输入备注" />
        </Form.Item>
      </div>
    </Form>
  )
}
