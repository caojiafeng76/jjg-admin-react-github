import { useStore } from '@/store'
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
    useStore()
  const { updateItems } = useUpdate()

  const layout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 20 },
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
    <Form {...layout} name="po-detail" form={form} onFinish={onFinish}>
      <Form.Item name="PartNo" label="件号">
        <Input disabled />
      </Form.Item>

      <Form.Item name="PartName" label="名称">
        <Input disabled />
      </Form.Item>

      <Form.Item name="Spec" label="规格">
        <Input disabled />
      </Form.Item>

      <Form.Item name="ParamSpec" label="参数规格" rules={[{ required: true }]}>
        <Input disabled={isLoading} />
      </Form.Item>

      <Form.Item name="Remark" label="备注">
        <Input.TextArea rows={4} cols={30} disabled />
      </Form.Item>
    </Form>
  )
})
