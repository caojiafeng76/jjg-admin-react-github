import { forwardRef, useImperativeHandle } from 'react'
import { Form, Input } from 'antd'

import { ISyneySpec, ISyneySpecFormRef } from '@/types'

const layout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 18 },
}

const SpecForm = forwardRef<
  ISyneySpecFormRef,
  { onFinishFunc: (values: ISyneySpec) => void; isEditing: boolean }
>(({ onFinishFunc, isEditing }, ref) => {
  const [form] = Form.useForm<ISyneySpec>()

  const onFinish = (values: ISyneySpec) => {
    onFinishFunc(values)
  }

  useImperativeHandle(ref, () => {
    return {
      getInstance() {
        return form
      },
    }
  })

  return (
    <Form
      {...layout}
      form={form}
      name="control-hooks"
      onFinish={onFinish}
      className="[&_.ant-form-item]:mb-3"
    >
      <Form.Item
        name="PartNo"
        label="件号"
        rules={[{ required: true }]}
      >
        <Input disabled={isEditing} className="rounded-lg" />
      </Form.Item>
      <Form.Item
        name="PartName"
        label="名称"
        rules={[{ required: true }]}
      >
        <Input className="rounded-lg" />
      </Form.Item>
      <Form.Item
        name="Spec"
        label="规格"
        rules={[{ required: true }]}
      >
        <Input className="rounded-lg" />
      </Form.Item>
      <Form.Item
        name="ParamSpec"
        label="参数"
        rules={[{ required: true }]}
      >
        <Input className="rounded-lg" />
      </Form.Item>
    </Form>
  )
})

export default SpecForm
