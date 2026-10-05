import { useEffect } from 'react'
import { Form, FormInstance, Input } from 'antd'

import type {
  JintanProfilesData,
  JintanProfilesDataFormValues,
} from '@/services/apiJintanProfilesData'

interface Props {
  onFinish: (values: JintanProfilesDataFormValues) => void
  setFormRef: (form: FormInstance<JintanProfilesDataFormValues>) => void
  isSubmitting: boolean
  initialValues?: JintanProfilesData | JintanProfilesDataFormValues
}

const DEFAULT_VALUES: JintanProfilesDataFormValues = {
  profile_model: '',
  profile_name: '',
  specification: '',
  material: '',
  remarks: '',
}

export default function JintanProfilesDataForm({
  onFinish,
  setFormRef,
  isSubmitting,
  initialValues,
}: Props) {
  const [form] = Form.useForm<JintanProfilesDataFormValues>()

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...DEFAULT_VALUES,
        profile_model: initialValues.profile_model,
        profile_name: initialValues.profile_name,
        specification: initialValues.specification,
        material: initialValues.material,
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
        name="profile_model"
        label="型号"
        rules={[{ max: 100, message: '型号不能超过 100 个字符' }]}
      >
        <Input placeholder="请输入型号" maxLength={100} />
      </Form.Item>

      <Form.Item
        name="profile_name"
        label="名称"
        rules={[
          { required: true, message: '请输入名称' },
          { max: 100, message: '名称不能超过 100 个字符' },
        ]}
      >
        <Input placeholder="请输入名称" maxLength={100} />
      </Form.Item>

      <Form.Item
        name="specification"
        label="规格"
        rules={[{ max: 100, message: '规格不能超过 100 个字符' }]}
      >
        <Input placeholder="请输入规格" maxLength={100} />
      </Form.Item>

      <Form.Item
        name="material"
        label="材质"
        rules={[{ max: 100, message: '材质不能超过 100 个字符' }]}
      >
        <Input placeholder="请输入材质" maxLength={100} />
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
