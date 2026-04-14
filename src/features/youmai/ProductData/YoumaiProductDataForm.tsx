import { useEffect } from 'react'
import { Form, FormInstance, Input, InputNumber } from 'antd'

import type {
  YoumaiProductData,
  YoumaiProductDataFormValues,
} from '@/services/apiYoumaiProductData'

interface Props {
  onFinish: (values: YoumaiProductDataFormValues) => void
  setFormRef: (form: FormInstance<YoumaiProductDataFormValues>) => void
  isSubmitting: boolean
  initialValues?: YoumaiProductData | YoumaiProductDataFormValues
}

const DEFAULT_VALUES: YoumaiProductDataFormValues = {
  material_code: '',
  material_name: '',
  model: '',
  specification: '',
  specific_gravity: 0,
  remarks: '',
}

export default function YoumaiProductDataForm({
  onFinish,
  setFormRef,
  isSubmitting,
  initialValues,
}: Props) {
  const [form] = Form.useForm<YoumaiProductDataFormValues>()

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...DEFAULT_VALUES,
        material_code: initialValues.material_code,
        material_name: initialValues.material_name,
        model: initialValues.model,
        specification: initialValues.specification,
        specific_gravity: Number(initialValues.specific_gravity || 0),
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
        name="material_code"
        label="物料编码"
        rules={[
          { required: true, message: '请输入物料编码' },
          { max: 50, message: '物料编码不能超过 50 个字符' },
        ]}
      >
        <Input placeholder="请输入物料编码" maxLength={50} />
      </Form.Item>

      <Form.Item
        name="material_name"
        label="物料名称"
        rules={[
          { required: true, message: '请输入物料名称' },
          { max: 100, message: '物料名称不能超过 100 个字符' },
        ]}
      >
        <Input placeholder="请输入物料名称" maxLength={100} />
      </Form.Item>

      <Form.Item
        name="model"
        label="型号"
        rules={[
          { required: true, message: '请输入型号' },
          { max: 100, message: '型号不能超过 100 个字符' },
        ]}
      >
        <Input placeholder="请输入型号" maxLength={100} />
      </Form.Item>

      <Form.Item
        name="specification"
        label="规格"
        rules={[
          { required: true, message: '请输入规格' },
          { max: 100, message: '规格不能超过 100 个字符' },
        ]}
      >
        <Input placeholder="请输入规格" maxLength={100} />
      </Form.Item>

      <Form.Item
        name="specific_gravity"
        label="比重"
        rules={[{ required: true, message: '请输入比重' }]}
      >
        <InputNumber
          min={0}
          step={0.001}
          precision={6}
          style={{ width: '100%' }}
          placeholder="请输入比重"
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
