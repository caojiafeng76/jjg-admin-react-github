import { FC, Ref, memo } from 'react'
import { DatePicker, Form, FormInstance, Input } from 'antd'
import { ISyneyPo } from '@/types'

type PoFormProps = {
  onFinish: (values: ISyneyPo) => void
  isCreating: boolean
  isEdit: boolean
  ref: Ref<FormInstance<ISyneyPo>> | undefined
  initialValues?: ISyneyPo
}

const layout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 20 },
}

const PoForm: FC<PoFormProps> = ({
  onFinish,
  isCreating,
  isEdit,
  ref,
  initialValues,
}) => {
  return (
    <Form
      ref={ref}
      {...layout}
      name="po-form"
      onFinish={onFinish}
      initialValues={initialValues}
      // preserve={false}
    >
      <Form.Item name="No" label="订单号" rules={[{ required: true }]}>
        <Input disabled={isCreating} />
      </Form.Item>
      <Form.Item name="EndDate" label="交货日期" rules={[{ required: true }]}>
        <DatePicker disabled={isCreating} />
      </Form.Item>
      {!isEdit && (
        <Form.Item name="Detail" label="详情" rules={[{ required: true }]}>
          <Input.TextArea rows={20} cols={30} disabled={isCreating} />
        </Form.Item>
      )}

      {isEdit && (
        <Form.Item name="Brand" label="商标" rules={[{ required: true }]}>
          <Input disabled={isCreating} />
        </Form.Item>
      )}
      {isEdit && (
        <Form.Item name="Technique" label="工艺要求">
          <Input disabled={isCreating} />
        </Form.Item>
      )}
      {isEdit && (
        <Form.Item name="Remark" label="备注">
          <Input disabled={isCreating} />
        </Form.Item>
      )}
    </Form>
  )
}

// 使用 memo 优化,避免不必要的重渲染
export default memo(PoForm)
