import type { FormInstance } from 'antd'
import type { WorkshopMiscMaterialsInventoryFormValues } from '@/services/apiWorkshopMiscMaterialsInventory'
import { Alert, Form, Input, InputNumber } from 'antd'
import { useEffect } from 'react'

import { formatQuantity, formatSignedQuantity } from './display'

export interface WorkshopMiscMaterialsInventoryAdjustFormProps {
  currentRaw: number
  currentSemi: number
  currentFinished: number
  initialRemarks: string
  onFinish: (values: WorkshopMiscMaterialsInventoryFormValues) => void
  setFormRef: (form: FormInstance<WorkshopMiscMaterialsInventoryFormValues>) => void
  isSubmitting: boolean
}

function getDifferenceText(target: number | null | undefined, current: number) {
  if (target === null || target === undefined)
    return null

  const difference = target - current
  if (difference === 0)
    return '未变化'

  return `差额 ${formatSignedQuantity(difference)}`
}

/** 车间杂项材料库存调整表单：同时调整原材料/半成品/成品数量与备注，由触发器写入调整流水 */
export default function WorkshopMiscMaterialsInventoryAdjustForm({
  currentRaw,
  currentSemi,
  currentFinished,
  initialRemarks,
  onFinish,
  setFormRef,
  isSubmitting,
}: WorkshopMiscMaterialsInventoryAdjustFormProps) {
  const [form] = Form.useForm<WorkshopMiscMaterialsInventoryFormValues>()
  const watchedRaw = Form.useWatch('raw_material_quantity', form) ?? currentRaw
  const watchedSemi = Form.useWatch('semi_finished_quantity', form) ?? currentSemi
  const watchedFinished = Form.useWatch('finished_quantity', form) ?? currentFinished

  const currentTotal = currentRaw + currentSemi + currentFinished
  const nextTotal = watchedRaw + watchedSemi + watchedFinished
  const totalDiff = nextTotal - currentTotal

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    form.setFieldsValue({
      raw_material_quantity: currentRaw,
      semi_finished_quantity: currentSemi,
      finished_quantity: currentFinished,
      remarks: initialRemarks,
    })
  }, [currentFinished, currentRaw, currentSemi, form, initialRemarks])

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        raw_material_quantity: currentRaw,
        semi_finished_quantity: currentSemi,
        finished_quantity: currentFinished,
        remarks: initialRemarks,
      }}
      onFinish={values =>
        onFinish({
          raw_material_quantity: values.raw_material_quantity ?? 0,
          semi_finished_quantity: values.semi_finished_quantity ?? 0,
          finished_quantity: values.finished_quantity ?? 0,
          remarks: values.remarks ?? '',
        })}
      disabled={isSubmitting}
    >
      <Alert
        className="mb-4"
        type="warning"
        showIcon
        title="直接修改库存数量，不生成出入库单；差额会记入调整记录，并计入当月月度报表。"
      />

      <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-600 sm:grid-cols-4 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
        <div>
          原原材料：
          <span className="font-medium tabular-nums">{formatQuantity(currentRaw)}</span>
        </div>
        <div>
          原半成品：
          <span className="font-medium tabular-nums">{formatQuantity(currentSemi)}</span>
        </div>
        <div>
          原成品：
          <span className="font-medium tabular-nums">{formatQuantity(currentFinished)}</span>
        </div>
        <div>
          原合计：
          <span className="font-semibold text-slate-900 tabular-nums dark:text-slate-100">
            {formatQuantity(currentTotal)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Form.Item
          name="raw_material_quantity"
          label="原材料数量"
          rules={[
            { required: true, message: '请输入原材料数量' },
            { type: 'integer', min: 0, message: '原材料数量必须为非负整数' },
          ]}
          extra={getDifferenceText(watchedRaw, currentRaw)}
        >
          <InputNumber min={0} precision={0} className="w-full" placeholder="原材料数量" />
        </Form.Item>

        <Form.Item
          name="semi_finished_quantity"
          label="半成品数量"
          rules={[
            { required: true, message: '请输入半成品数量' },
            { type: 'integer', min: 0, message: '半成品数量必须为非负整数' },
          ]}
          extra={getDifferenceText(watchedSemi, currentSemi)}
        >
          <InputNumber min={0} precision={0} className="w-full" placeholder="半成品数量" />
        </Form.Item>

        <Form.Item
          name="finished_quantity"
          label="成品数量"
          rules={[
            { required: true, message: '请输入成品数量' },
            { type: 'integer', min: 0, message: '成品数量必须为非负整数' },
          ]}
          extra={getDifferenceText(watchedFinished, currentFinished)}
        >
          <InputNumber min={0} precision={0} className="w-full" placeholder="成品数量" />
        </Form.Item>
      </div>

      <div className="mb-4 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
        <span>
          调整后合计：
          <span className="font-semibold text-slate-900 tabular-nums dark:text-slate-100">
            {formatQuantity(nextTotal)}
          </span>
        </span>
        <span className="tabular-nums">
          总差额：
          <span className={totalDiff < 0 ? 'font-medium text-error' : 'font-medium'}>
            {formatSignedQuantity(totalDiff)}
          </span>
        </span>
      </div>

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
