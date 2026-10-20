import type { FormInstance } from 'antd'
import type { Ref } from 'react'
import type { ISyneyItem } from '@/types'
import { Form, Input } from 'antd'
import { useImperativeHandle, useState } from 'react'
import { useAppStore } from '@/store'
import { useUpdate } from './useUpdate'

export interface DetailFormRef {
  getInstance: () => FormInstance<ISyneyItem>
}

export interface DetailFormProps {
  ref?: Ref<DetailFormRef>
  onClose: () => void
  onLoadingChange?: (loading: boolean) => void
}

export default function DetailForm({
  ref,
  onClose,
  onLoadingChange,
}: DetailFormProps) {
  const [form] = Form.useForm<ISyneyItem>()
  const [isLoading, setIsLoading] = useState(false)

  const tableSelectedKeys = useAppStore(state => state.tableSelectedKeys)
  const setTableSelectedKeys = useAppStore(
    state => state.setTableSelectedKeys,
  )
  const { updateItems } = useUpdate()

  const layout = {
    labelCol: { span: 6 },
    wrapperCol: { span: 18 },
  }

  async function onFinish(values: ISyneyItem) {
    setIsLoading(true)
    onLoadingChange?.(true)
    await updateItems(
      { ids: tableSelectedKeys.map(Number), values },
      {
        onSettled: () => {
          setTableSelectedKeys([])
          setIsLoading(false)
          onLoadingChange?.(false)
          onClose()
        },
      },
    )
  }

  useImperativeHandle(ref, () => ({ getInstance: () => form }))

  return (
    <Form
      {...layout}
      name="po-detail"
      form={form}
      onFinish={onFinish}
      className="[&_.ant-form-item]:mb-3"
    >
      <Form.Item name="PartNo" label="件号">
        <Input disabled className="rounded-lg" />
      </Form.Item>

      <Form.Item name="PartName" label="名称">
        <Input disabled className="rounded-lg" />
      </Form.Item>

      <Form.Item name="Spec" label="规格">
        <Input disabled className="rounded-lg" />
      </Form.Item>

      <Form.Item
        name="ParamSpec"
        label="参数规格"
        rules={[{ required: true }]}
      >
        <Input
          disabled={isLoading}
          className="rounded-lg"
          placeholder="请输入参数规格"
        />
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
