import { Form, FormInstance, Input } from 'antd'

import { ISyneyItem } from '@/types'
import { Ref } from 'react'

const layout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 18 },
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
      className="[&_.ant-form-item]:mb-3"
    >
      <Form.Item name="id" label="id" hidden>
        <Input hidden disabled={true} />
      </Form.Item>
      <Form.Item name="PartNo" label="件号">
        <Input disabled={true} className="rounded-lg" />
      </Form.Item>
      <Form.Item name="PartName" label="名称">
        <Input disabled={true} className="rounded-lg" />
      </Form.Item>
      <Form.Item name="Spec" label="规格">
        <Input disabled={true} className="rounded-lg" />
      </Form.Item>
      <Form.Item
        name="ParamSpec"
        label="参数"
        rules={[{ required: true }]}
      >
        <Input className="rounded-lg" placeholder="请输入参数" />
      </Form.Item>
      <Form.Item name="Remark" label="备注">
        <Input.TextArea
          rows={4}
          disabled
          className="rounded-lg"
          placeholder="备注不可编辑"
        />
      </Form.Item>
    </Form>
  )
}
