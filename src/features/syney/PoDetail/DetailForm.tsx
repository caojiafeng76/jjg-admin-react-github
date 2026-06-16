import { useAppStore } from '@/store'
import { ISyneyItem } from '@/types'
import { Form, FormInstance, Input } from 'antd'
import { forwardRef, useImperativeHandle } from 'react'
import { useUpdate } from './useUpdate'

export default forwardRef<
  {
    getInstance: () => FormInstance<ISyneyItem>
  },
  { onClose: () => void }
>(function DetailForm({ onClose }, ref) {
  const [form] = Form.useForm<ISyneyItem>()

  const { tableSelectedKeys, setTableSelectedKeys, isLoading, setIsLoading } =
    useAppStore()
  const { updateItems } = useUpdate()

  const layout = {
    labelCol: { span: 6 },
    wrapperCol: { span: 18 },
  }

  async function onFinish(values: ISyneyItem) {
    setIsLoading(true)
    await updateItems(
      { ids: tableSelectedKeys.map(Number), values },
      {
        onSettled: () => {
          setTableSelectedKeys([])
          setIsLoading(false)
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
})
