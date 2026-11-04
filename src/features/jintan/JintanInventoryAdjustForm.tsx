import type { FormInstance } from 'antd'
import { Alert, Form, Input, InputNumber } from 'antd'

import { useEffect } from 'react'

export interface JintanInventoryAdjustFormValues {
  quantity: number
  remarks: string
}

export interface JintanInventoryAdjustFormProps {
  currentQuantity: number
  initialRemarks: string
  onFinish: (values: JintanInventoryAdjustFormValues) => void
  setFormRef: (form: FormInstance<JintanInventoryAdjustFormValues>) => void
  isSubmitting: boolean
}

function getDifferenceText(target: number | null | undefined, current: number) {
  if (target === null || target === undefined)
    return null

  const difference = target - current
  if (difference === 0)
    return '数量未变化'

  return `差额 ${difference > 0 ? '+' : ''}${difference.toLocaleString('zh-CN')}`
}

/** 资料详情抽屉内的库存调整表单：直接改库存行，不生成出入库记录 */
export default function JintanInventoryAdjustForm({
  currentQuantity,
  initialRemarks,
  onFinish,
  setFormRef,
  isSubmitting,
}: JintanInventoryAdjustFormProps) {
  const [form] = Form.useForm<JintanInventoryAdjustFormValues>()
  const watchedQuantity = Form.useWatch('quantity', form)
  const differenceText = getDifferenceText(watchedQuantity, currentQuantity)

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{ quantity: currentQuantity, remarks: initialRemarks }}
      onFinish={onFinish}
      disabled={isSubmitting}
    >
      <Alert
        className="mb-4"
        type="warning"
        showIcon
        title="直接修改库存数量，不生成出入库记录；月度报表各月的上月结余和月末结存会随差额变化。"
      />

      <div className="mb-4 text-sm text-slate-600 dark:text-slate-300">
        当前库存：
        <span className="font-medium tabular-nums">
          {currentQuantity.toLocaleString('zh-CN')}
        </span>
      </div>

      <Form.Item
        name="quantity"
        label="调整后数量"
        rules={[{ required: true, message: '请输入调整后数量' }]}
        extra={differenceText}
      >
        <InputNumber
          min={0}
          precision={0}
          style={{ width: '100%' }}
          placeholder="请输入调整后数量"
        />
      </Form.Item>

      <Form.Item
        name="remarks"
        label="备注"
        rules={[{ max: 500, message: '备注不能超过 500 个字符' }]}
      >
        <Input.TextArea
          placeholder="可填写调整原因，将覆盖库存备注"
          maxLength={500}
          autoSize={{ minRows: 3, maxRows: 5 }}
        />
      </Form.Item>
    </Form>
  )
}
