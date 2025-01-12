import { Form, FormInstance, Input } from 'antd'

import { ISyneyItem } from '@/types'
import { Ref } from 'react'

const layout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 20 },
}

type FormProps = {
  ref: Ref<FormInstance<ISyneyItem>> | undefined
  onFinishFuc: (values: ISyneyItem) => void
}

export default function DetailForm({ ref, onFinishFuc }: FormProps) {
  const [form] = Form.useForm<ISyneyItem>()

  function onFinish(values: ISyneyItem) {
    onFinishFuc(values)
  }

  return (
    <Form
      {...layout}
      form={form}
      name="detail-form"
      onFinish={onFinish}
      ref={ref}
    >
      <Form.Item name="id" label="id">
        <Input hidden={true} disabled={true} />
      </Form.Item>
      <Form.Item name="PartNo" label="件号">
        <Input disabled={true} />
      </Form.Item>
      <Form.Item name="PartName" label="名称">
        <Input disabled={true} />
      </Form.Item>
      <Form.Item name="Spec" label="规格">
        <Input disabled={true} />
      </Form.Item>
      <Form.Item name="ParamSpec" label="参数" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="Remark" label="备注">
        <Input.TextArea rows={4} disabled />
      </Form.Item>
    </Form>
  )
}
