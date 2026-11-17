import type { FormInstance } from 'antd'
import { Alert, Form, Input, InputNumber } from 'antd'
import { useEffect } from 'react'

import { formatNumber } from '@/utils/format'

export interface YoumaiFinishedGoodsInventoryAdjustFormValues {
  current_stock: number
  remarks: string
}

export interface YoumaiFinishedGoodsInventoryAdjustFormProps {
  currentStock: number
  initialRemarks: string
  onFinish: (values: YoumaiFinishedGoodsInventoryAdjustFormValues) => void
  setFormRef: (
    form: FormInstance<YoumaiFinishedGoodsInventoryAdjustFormValues>,
  ) => void
  isSubmitting: boolean
}

function getDifferenceText(
  target: number | null | undefined,
  current: number,
) {
  if (target === null || target === undefined)
    return null

  const difference = target - current
  if (difference === 0)
    return '数量未变化'

  const formatted = Number.isInteger(difference)
    ? formatNumber(difference, 0)
    : formatNumber(difference, 3)

  return `差额 ${difference > 0 ? '+' : ''}${formatted}`
}

/** 抽屉内的优迈成品库存调整表单：直接改现有库存，由数据库触发器写入调整流水 */
export default function YoumaiFinishedGoodsInventoryAdjustForm({
  currentStock,
  initialRemarks,
  onFinish,
  setFormRef,
  isSubmitting,
}: YoumaiFinishedGoodsInventoryAdjustFormProps) {
  const [form] = Form.useForm<YoumaiFinishedGoodsInventoryAdjustFormValues>()
  const watchedStock = Form.useWatch('current_stock', form)
  const differenceText = getDifferenceText(watchedStock, currentStock)

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    form.setFieldsValue({
      current_stock: currentStock,
      remarks: initialRemarks,
    })
  }, [currentStock, form, initialRemarks])

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{ current_stock: currentStock, remarks: initialRemarks }}
      onFinish={onFinish}
      disabled={isSubmitting}
    >
      <Alert
        className="mb-4"
        type="warning"
        showIcon
        title="直接修改现有库存数量，不生成入库或出库单；差额会自动记入调整记录。"
      />

      <div className="mb-4 text-sm text-slate-600 dark:text-slate-300">
        当前现有库存：
        <span className="font-medium tabular-nums">
          {Number.isInteger(currentStock)
            ? formatNumber(currentStock, 0)
            : formatNumber(currentStock, 3)}
        </span>
      </div>

      <Form.Item
        name="current_stock"
        label="调整后现有库存"
        rules={[{ required: true, message: '请输入调整后现有库存' }]}
        extra={differenceText}
      >
        <InputNumber
          min={0}
          precision={0}
          style={{ width: '100%' }}
          placeholder="请输入调整后现有库存"
        />
      </Form.Item>

      <Form.Item
        name="remarks"
        label="备注"
        rules={[{ max: 500, message: '备注不能超过 500 个字符' }]}
      >
        <Input.TextArea
          placeholder="可填写调整原因，将更新库存备注并记入调整记录"
          maxLength={500}
          autoSize={{ minRows: 3, maxRows: 5 }}
        />
      </Form.Item>
    </Form>
  )
}
