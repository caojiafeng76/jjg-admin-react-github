import { FC, Ref } from 'react'
import { DatePicker, Form, FormInstance, Input, Select } from 'antd'
import { ISyneyPo } from '@/types'

type PoFormProps = {
  onFinish: (values: ISyneyPo) => void
  isCreating: boolean
  isEdit: boolean
  ref: Ref<FormInstance<ISyneyPo>> | undefined
}

const layout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 20 },
}

const PoForm: FC<PoFormProps> = ({ onFinish, isCreating, isEdit, ref }) => {
  const [form] = Form.useForm<ISyneyPo>()

  return (
    <>
      <Form
        ref={ref}
        {...layout}
        form={form}
        name="po-form"
        onFinish={onFinish}
        // preserve={false}
      >
        <Form.Item name="No" label="订单号" rules={[{ required: true }]}>
          <Input disabled={isCreating} />
        </Form.Item>
        <Form.Item name="Spec" label="规格" rules={[{ required: true }]}>
          <Select
            disabled={isCreating}
            options={[
              {
                value: '1000型-室内-扶梯',
                label: <span>1000型-室内-扶梯</span>,
              },
              {
                value: '1000型-室外-扶梯',
                label: <span>1000型-室外-扶梯</span>,
              },
              {
                value: '1000型-室内-人行道',
                label: <span>1000型-室内-人行道</span>,
              },
              {
                value: '1000型-室外-人行道',
                label: <span>1000型-室外-人行道</span>,
              },
              {
                value: '800型-室内-扶梯',
                label: <span>800型-室内-扶梯</span>,
              },
              {
                value: '800型-室外-扶梯',
                label: <span>800型-室外-扶梯</span>,
              },
              {
                value: '800型-室内-人行道',
                label: <span>800型-室内-人行道</span>,
              },
              {
                value: '800型-室外-人行道',
                label: <span>800型-室外-人行道</span>,
              },
              {
                value: '600型-室内-扶梯',
                label: <span>600型-室内-扶梯</span>,
              },
              {
                value: '600型-室外-扶梯',
                label: <span>600型-室外-扶梯</span>,
              },
            ]}
          />
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
    </>
  )
}

export default PoForm
