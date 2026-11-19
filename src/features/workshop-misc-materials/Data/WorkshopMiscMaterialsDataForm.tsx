import type { FormInstance } from 'antd'
import type {
  WorkshopMiscMaterialsData,
  WorkshopMiscMaterialsDataFormValues,
} from '@/services/apiWorkshopMiscMaterialsData'
import { AutoComplete, Form, Input } from 'antd'
import { useEffect, useMemo } from 'react'

import { useWorkshopMiscMaterialsCategories } from '../useWorkshopMiscMaterialsCategories'

export interface WorkshopMiscMaterialsDataFormProps {
  onFinish: (values: WorkshopMiscMaterialsDataFormValues) => void
  setFormRef: (form: FormInstance<WorkshopMiscMaterialsDataFormValues>) => void
  isSubmitting: boolean
  initialValues?: WorkshopMiscMaterialsData | WorkshopMiscMaterialsDataFormValues
}

const DEFAULT_VALUES: WorkshopMiscMaterialsDataFormValues = {
  model: '',
  customer_model: '',
  specification: '',
  category: '',
  remarks: '',
}

export default function WorkshopMiscMaterialsDataForm({
  onFinish,
  setFormRef,
  isSubmitting,
  initialValues,
}: WorkshopMiscMaterialsDataFormProps) {
  const [form] = Form.useForm<WorkshopMiscMaterialsDataFormValues>()
  const { data: categories = [] } = useWorkshopMiscMaterialsCategories()

  const categoryOptions = useMemo(
    () => categories.map(category => ({ value: category, label: category })),
    [categories],
  )

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        model: initialValues.model,
        customer_model: initialValues.customer_model,
        specification: initialValues.specification,
        category: initialValues.category,
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
        name="model"
        label="型号"
        rules={[
          { required: true, whitespace: true, message: '请输入型号' },
          { max: 100, message: '型号不能超过 100 个字符' },
        ]}
      >
        <Input placeholder="请输入型号（如 196-001）" maxLength={100} />
      </Form.Item>

      <Form.Item
        name="customer_model"
        label="客户型号"
        rules={[{ max: 100, message: '客户型号不能超过 100 个字符' }]}
      >
        <Input placeholder="请输入客户型号（可选）" maxLength={100} />
      </Form.Item>

      <Form.Item
        name="specification"
        label="规格"
        rules={[{ max: 100, message: '规格不能超过 100 个字符' }]}
      >
        <Input placeholder="请输入规格（可选）" maxLength={100} />
      </Form.Item>

      <Form.Item
        name="category"
        label="类别"
        rules={[{ max: 50, message: '类别不能超过 50 个字符' }]}
      >
        <AutoComplete
          options={categoryOptions}
          placeholder="请输入或选择历史类别（可选）"
          maxLength={50}
          allowClear
          showSearch={{
            filterOption: (inputValue, option) =>
              String(option?.value ?? '')
                .toLowerCase()
                .includes(inputValue.trim().toLowerCase()),
          }}
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
