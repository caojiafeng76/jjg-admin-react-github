import { forwardRef, useImperativeHandle } from 'react'
import { Form, Input } from 'antd'

import { ISyneyItem, ISyneyItemFormRef } from '@/types'
import TextArea from 'antd/es/input/TextArea'

const layout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 20 },
}

const DetailForm = forwardRef<
  ISyneyItemFormRef,
  { onFinishFunc: (values: ISyneyItem) => void }
>(({ onFinishFunc }, ref) => {
  const [form] = Form.useForm<ISyneyItem>()

  const onFinish = (values: ISyneyItem) => {
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
    <>
      <Form {...layout} form={form} name="detail-form" onFinish={onFinish}>
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
          <TextArea rows={4} disabled />
        </Form.Item>
      </Form>
    </>
  )
})

export default DetailForm
