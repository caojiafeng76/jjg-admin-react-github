import type { Ref } from 'react'
import type { ISyneySpec, ISyneySpecFormRef } from '@/types'
import { Form, Input } from 'antd'

import { useCallback, useImperativeHandle } from 'react'

export interface SpecFormProps {
  ref?: Ref<ISyneySpecFormRef>
  onFinishFunc: (values: ISyneySpec) => void
  isEditing: boolean
  initialValues?: Partial<ISyneySpec>
}

export default function SpecForm({ ref, onFinishFunc, isEditing, initialValues }: SpecFormProps) {
  const [form] = Form.useForm<ISyneySpec>()

  const onFinish = useCallback(
    (values: ISyneySpec) => {
      onFinishFunc(values)
    },
    [onFinishFunc],
  )

  useImperativeHandle(ref, () => {
    return {
      getInstance() {
        return form
      },
    }
  })

  return (
    <Form
      layout="vertical"
      form={form}
      name="control-hooks"
      initialValues={initialValues}
      onFinish={onFinish}
      className="[&_.ant-form-item]:mb-3"
    >
      <Form.Item
        name="PartNo"
        label="件号"
        rules={[{ required: true, message: '请输入件号' }]}
      >
        <Input disabled={isEditing} className="rounded-lg" />
      </Form.Item>
      <Form.Item
        name="PartName"
        label="名称"
        rules={[{ required: true, message: '请输入名称' }]}
      >
        <Input className="rounded-lg" />
      </Form.Item>
      <Form.Item
        name="Spec"
        label="规格"
        rules={[{ required: true, message: '请输入规格' }]}
      >
        <Input className="rounded-lg" />
      </Form.Item>
      <Form.Item
        name="ParamSpec"
        label="参数规格"
        rules={[{ required: true, message: '请输入参数规格' }]}
      >
        <Input className="rounded-lg" />
      </Form.Item>
    </Form>
  )
}
