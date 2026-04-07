import { useEffect } from 'react'
import { Form, FormInstance, Input, InputNumber } from 'antd'

import type {
  ToolingData,
  ToolingDataFormValues,
} from '@/services/apiToolingData'

interface Props {
  onFinish: (values: ToolingDataFormValues) => void
  setFormRef: (form: FormInstance<ToolingDataFormValues>) => void
  isSubmitting: boolean
  initialValues?: ToolingData | ToolingDataFormValues
}

const DEFAULT_VALUES: ToolingDataFormValues = {
  tool_code: '',
  tool_name: '',
  tool_spec: '',
  material: '',
  unit_price: 0,
  usage: '',
  remarks: '',
}

export default function ToolingDataForm({
  onFinish,
  setFormRef,
  isSubmitting,
  initialValues,
}: Props) {
  const [form] = Form.useForm<ToolingDataFormValues>()

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...DEFAULT_VALUES,
        tool_code: initialValues.tool_code,
        tool_name: initialValues.tool_name,
        tool_spec: initialValues.tool_spec,
        material: initialValues.material,
        unit_price: Number(initialValues.unit_price || 0),
        usage: initialValues.usage,
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
        name="tool_code"
        label="刀具编号"
        rules={[
          { required: true, message: '请输入刀具编号' },
          { max: 50, message: '刀具编号不能超过 50 个字符' },
        ]}
      >
        <Input placeholder="请输入刀具编号" maxLength={50} />
      </Form.Item>

      <Form.Item
        name="tool_name"
        label="刀具名称"
        rules={[
          { required: true, message: '请输入刀具名称' },
          { max: 100, message: '刀具名称不能超过 100 个字符' },
        ]}
      >
        <Input placeholder="请输入刀具名称" maxLength={100} />
      </Form.Item>

      <Form.Item
        name="tool_spec"
        label="刀具规格"
        rules={[
          { required: true, message: '请输入刀具规格' },
          { max: 100, message: '刀具规格不能超过 100 个字符' },
        ]}
      >
        <Input placeholder="请输入刀具规格" maxLength={100} />
      </Form.Item>

      <Form.Item
        name="material"
        label="材质"
        rules={[
          { required: true, message: '请输入材质' },
          { max: 100, message: '材质不能超过 100 个字符' },
        ]}
      >
        <Input placeholder="请输入材质" maxLength={100} />
      </Form.Item>

      <Form.Item
        name="unit_price"
        label="单价（元）"
        rules={[{ required: true, message: '请输入单价' }]}
      >
        <InputNumber
          min={0}
          step={0.01}
          precision={2}
          style={{ width: '100%' }}
          placeholder="请输入单价"
        />
      </Form.Item>

      <Form.Item
        name="usage"
        label="用途"
        rules={[
          { required: true, message: '请输入用途' },
          { max: 200, message: '用途不能超过 200 个字符' },
        ]}
      >
        <Input placeholder="请输入用途" maxLength={200} />
      </Form.Item>

      <Form.Item
        name="remarks"
        label="备注"
        rules={[
          { required: true, message: '请输入备注' },
          { max: 500, message: '备注不能超过 500 个字符' },
        ]}
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
