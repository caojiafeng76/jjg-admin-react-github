import { useCallback, useEffect, useMemo, useState } from 'react'
import { Form, type FormInstance, Input, InputNumber, Select } from 'antd'

import type {
  PackagingStandardTime,
  PackagingStandardTimeFormValues,
} from '@/services/apiPackagingStandardTimes'
import type { SalesOrderProjectNoOption } from '@/services/apiProcessStandards'
import { usePackagingSalesOrdersProjectNos } from './useStandardTimes'

interface Props {
  onFinish: (values: PackagingStandardTimeFormValues) => void
  setFormRef: (form: FormInstance<PackagingStandardTimeFormValues>) => void
  isSubmitting: boolean
  initialValues?: PackagingStandardTime | PackagingStandardTimeFormValues
}

const DEFAULT_VALUES: PackagingStandardTimeFormValues = {
  model: '',
  length: 0,
  part_no: null,
  standard_seconds: 0,
  remark: null,
}

export default function StandardTimeForm({
  onFinish,
  setFormRef,
  isSubmitting,
  initialValues,
}: Props) {
  const [form] = Form.useForm<PackagingStandardTimeFormValues>()
  const [projectNoValue, setProjectNoValue] = useState<string | undefined>(
    undefined,
  )

  const {
    data: salesOrderOptions = [],
    isLoading: isSalesOrderOptionsLoading,
  } = usePackagingSalesOrdersProjectNos()

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...DEFAULT_VALUES,
        model: initialValues.model,
        length: initialValues.length,
        part_no: initialValues.part_no,
        standard_seconds: initialValues.standard_seconds,
        remark: initialValues.remark,
      })
      setProjectNoValue(undefined)
      return
    }

    form.resetFields()
    form.setFieldsValue(DEFAULT_VALUES)
    setProjectNoValue(undefined)
  }, [form, initialValues])

  const salesOrderProjectNoSelectOptions = useMemo(
    () =>
      salesOrderOptions.map((option: SalesOrderProjectNoOption) => ({
        label: [option.project_no, option.customer_model, option.product_model]
          .filter(Boolean)
          .join('　'),
        value: option.project_no,
        searchText: [
          option.project_no,
          option.customer_model,
          option.product_model,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase(),
      })),
    [salesOrderOptions],
  )

  const handleProjectNoChange = useCallback(
    (projectNo: string | undefined) => {
      setProjectNoValue(projectNo)
      if (!projectNo) return
      const salesOrder = salesOrderOptions.find(
        (o: SalesOrderProjectNoOption) => o.project_no === projectNo,
      )
      if (salesOrder) {
        form.setFieldsValue({
          model: salesOrder.product_model ?? '',
          length: salesOrder.length_mm ?? 0,
          part_no: salesOrder.material_code ?? null,
        })
      }
    },
    [form, salesOrderOptions],
  )

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      disabled={isSubmitting}
    >
      <Form.Item
        label="项目号"
        extra="选择项目号后自动带出型号、长度、料号，仍可手工修改"
      >
        <Select
          allowClear
          showSearch
          disabled={isSubmitting}
          loading={isSalesOrderOptionsLoading}
          placeholder="请选择或搜索项目号"
          value={projectNoValue}
          onChange={handleProjectNoChange}
          filterOption={(input, option) =>
            String(option?.searchText || '')
              .toLowerCase()
              .includes(input.toLowerCase())
          }
          options={salesOrderProjectNoSelectOptions}
        />
      </Form.Item>

      <Form.Item
        name="model"
        label="型号"
        rules={[
          { required: true, message: '请输入型号' },
          { max: 100, message: '型号不能超过 100 个字符' },
        ]}
      >
        <Input placeholder="请输入型号" allowClear />
      </Form.Item>

      <Form.Item
        name="length"
        label="长度"
        rules={[{ required: true, message: '请输入长度' }]}
      >
        <InputNumber
          min={0}
          step={0.01}
          style={{ width: '100%' }}
          placeholder="请输入长度"
        />
      </Form.Item>

      <Form.Item name="part_no" label="料号">
        <Input placeholder="请输入料号" allowClear />
      </Form.Item>

      <Form.Item
        name="standard_seconds"
        label="标准工时（秒）"
        rules={[{ required: true, message: '请输入标准工时' }]}
      >
        <InputNumber
          min={0}
          step={1}
          style={{ width: '100%' }}
          placeholder="请输入标准工时"
        />
      </Form.Item>

      <Form.Item name="remark" label="备注">
        <Input.TextArea rows={3} placeholder="请输入备注" />
      </Form.Item>
    </Form>
  )
}
