import type { FormInstance } from 'antd'
import type {
  SyneyMaterialsData,
  SyneyMaterialsDataFormValues,
} from '@/services/apiSyneyMaterialsData'
import { Form, Input } from 'antd'
import { useEffect } from 'react'

export interface SyneyMaterialsDataFormProps {
  onFinish: (values: SyneyMaterialsDataFormValues) => void
  setFormRef: (form: FormInstance<SyneyMaterialsDataFormValues>) => void
  isSubmitting: boolean
  initialValues?: SyneyMaterialsData | SyneyMaterialsDataFormValues
}

const DEFAULT_VALUES: SyneyMaterialsDataFormValues = {
  material_name: '',
  specification: '',
  unit: '',
  remarks: '',
}

export default function SyneyMaterialsDataForm({
  onFinish,
  setFormRef,
  isSubmitting,
  initialValues,
}: SyneyMaterialsDataFormProps) {
  const [form] = Form.useForm<SyneyMaterialsDataFormValues>()

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        material_name: initialValues.material_name,
        specification: initialValues.specification,
        unit: initialValues.unit,
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
        name="material_name"
        label="品名"
        rules={[
          { required: true, whitespace: true, message: '请输入品名' },
          { max: 100, message: '品名不能超过 100 个字符' },
        ]}
      >
        <Input placeholder="请输入品名" maxLength={100} />
      </Form.Item>

      <Form.Item
        name="specification"
        label="规格"
        rules={[{ max: 100, message: '规格不能超过 100 个字符' }]}
      >
        <Input placeholder="请输入规格" maxLength={100} />
      </Form.Item>

      <Form.Item
        name="unit"
        label="单位"
        rules={[
          { required: true, whitespace: true, message: '请输入单位' },
          { max: 20, message: '单位不能超过 20 个字符' },
        ]}
      >
        <Input placeholder="如：个、件、kg、米" maxLength={20} />
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
