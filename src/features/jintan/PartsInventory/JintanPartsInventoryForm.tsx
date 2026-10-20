import { useEffect } from 'react'
import { Form, FormInstance, Input, InputNumber } from 'antd'

import type {
  JintanPartsInventory,
  JintanPartsInventoryFormValues,
} from '@/services/apiJintanPartsInventory'
import {
  calcJintanPartsSafetyStock,
  getJintanPartsStockStatus,
  JINTAN_PARTS_DEFAULT_SAFETY_MULTIPLE,
  JINTAN_PARTS_STOCK_STATUS_CONFIG,
  JINTAN_PARTS_THRESHOLD_MULTIPLE,
} from './stockStatus'

interface Props {
  onFinish: (values: JintanPartsInventoryFormValues) => void
  setFormRef: (form: FormInstance<JintanPartsInventoryFormValues>) => void
  isSubmitting: boolean
  initialValues?: JintanPartsInventory | JintanPartsInventoryFormValues
}

const DEFAULT_VALUES: JintanPartsInventoryFormValues = {
  quantity: 0,
  remarks: '',
  unit_quantity: null,
  safety_multiple: JINTAN_PARTS_DEFAULT_SAFETY_MULTIPLE,
}

export default function JintanPartsInventoryForm({
  onFinish,
  setFormRef,
  isSubmitting,
  initialValues,
}: Props) {
  const [form] = Form.useForm<JintanPartsInventoryFormValues>()

  const partSnapshot =
    initialValues && 'part_data_id' in initialValues ? initialValues : undefined

  const watchedQuantity = Form.useWatch('quantity', form)
  const watchedUnitQuantity = Form.useWatch('unit_quantity', form)
  const watchedSafetyMultiple = Form.useWatch('safety_multiple', form)
  const safetyPreview = calcJintanPartsSafetyStock(
    watchedUnitQuantity,
    watchedSafetyMultiple,
  )
  const statusPreview =
    JINTAN_PARTS_STOCK_STATUS_CONFIG[
      getJintanPartsStockStatus(
        Number(watchedQuantity || 0),
        watchedUnitQuantity,
        watchedSafetyMultiple,
      )
    ]

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...DEFAULT_VALUES,
        quantity: Number(initialValues.quantity || 0),
        remarks: initialValues.remarks,
        unit_quantity: initialValues.unit_quantity ?? null,
        safety_multiple:
          initialValues.safety_multiple ?? JINTAN_PARTS_DEFAULT_SAFETY_MULTIPLE,
      })
      return
    }

    form.resetFields()
    form.setFieldsValue(DEFAULT_VALUES)
  }, [form, initialValues])

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      disabled={isSubmitting}
    >
      {partSnapshot && (
        <div className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 md:grid-cols-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <div>
            <div className="text-xs text-slate-400">名称</div>
            <div>{partSnapshot.part_name || '-'}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">规格</div>
            <div>{partSnapshot.specification || '-'}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">材质</div>
            <div>{partSnapshot.material || '-'}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">采购厂家</div>
            <div>{partSnapshot.supplier || '-'}</div>
          </div>
        </div>
      )}

      <Form.Item
        name="quantity"
        label="库存数量"
        rules={[{ required: true, message: '请输入库存数量' }]}
      >
        <InputNumber
          min={0}
          precision={0}
          style={{ width: '100%' }}
          placeholder="请输入库存数量"
        />
      </Form.Item>

      <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
        <Form.Item
          name="unit_quantity"
          label="单台数量"
          tooltip="清空表示不设置安全库存，库存数量不着色"
        >
          <InputNumber
            min={1}
            precision={0}
            style={{ width: '100%' }}
            placeholder="未设置"
          />
        </Form.Item>
        <Form.Item
          name="safety_multiple"
          label="倍数"
          tooltip={`安全库存 = 单台数量 × 倍数；阈值 = 单台数量 × ${JINTAN_PARTS_THRESHOLD_MULTIPLE}`}
          rules={[
            { required: true, message: '请输入倍数' },
            {
              type: 'number',
              min: JINTAN_PARTS_THRESHOLD_MULTIPLE,
              message: `倍数不能小于 ${JINTAN_PARTS_THRESHOLD_MULTIPLE}`,
            },
          ]}
        >
          <InputNumber
            min={JINTAN_PARTS_THRESHOLD_MULTIPLE}
            precision={0}
            style={{ width: '100%' }}
            placeholder="请输入倍数"
          />
        </Form.Item>
      </div>

      <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
        {safetyPreview ? (
          <span>
            安全库存 <b className="tabular-nums">{safetyPreview.safetyStock}</b>
            ，阈值{' '}
            <b className="tabular-nums">{safetyPreview.thresholdStock}</b>
            ，当前状态：{statusPreview.label}
          </span>
        ) : (
          <span>未设置单台数量，不判断库存状态</span>
        )}
      </div>

      <Form.Item
        name="remarks"
        label="备注"
        rules={[{ max: 500, message: '备注不能超过 500 个字符' }]}
      >
        <Input.TextArea
          placeholder="请输入备注"
          maxLength={500}
          autoSize={{ minRows: 3, maxRows: 5 }}
        />
      </Form.Item>
    </Form>
  )
}
