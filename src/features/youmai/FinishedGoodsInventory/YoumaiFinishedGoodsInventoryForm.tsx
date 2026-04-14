import { useEffect, useMemo } from 'react'
import { Form, type FormInstance, Input, InputNumber, Select } from 'antd'

import type {
  YoumaiFinishedGoodsInventory,
  YoumaiFinishedGoodsInventoryFormValues,
  YoumaiProductDataOption,
} from '@/services/apiYoumaiFinishedGoodsInventory'

interface Props {
  onFinish: (values: YoumaiFinishedGoodsInventoryFormValues) => void
  setFormRef: (
    form: FormInstance<YoumaiFinishedGoodsInventoryFormValues>,
  ) => void
  isSubmitting: boolean
  productOptions: YoumaiProductDataOption[]
  initialValues?:
    | YoumaiFinishedGoodsInventory
    | YoumaiFinishedGoodsInventoryFormValues
}

const DEFAULT_VALUES: YoumaiFinishedGoodsInventoryFormValues = {
  product_data_id: '',
  pending_stock_in: 0,
  pending_stock_out: 0,
  current_stock: 0,
  remarks: '',
}

export default function YoumaiFinishedGoodsInventoryForm({
  onFinish,
  setFormRef,
  isSubmitting,
  productOptions,
  initialValues,
}: Props) {
  const [form] = Form.useForm<YoumaiFinishedGoodsInventoryFormValues>()
  const selectedProductId = Form.useWatch('product_data_id', form)

  const selectedProduct = useMemo(
    () => productOptions.find((item) => item.id === selectedProductId),
    [productOptions, selectedProductId],
  )

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...DEFAULT_VALUES,
        product_data_id: initialValues.product_data_id,
        pending_stock_in: Number(initialValues.pending_stock_in || 0),
        pending_stock_out: Number(initialValues.pending_stock_out || 0),
        current_stock: Number(initialValues.current_stock || 0),
        remarks: initialValues.remarks,
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
      <Form.Item
        name="product_data_id"
        label="关联货品资料"
        rules={[{ required: true, message: '请选择货品资料' }]}
      >
        <Select
          showSearch={{
            filterOption: (input, option) =>
              String(option?.label || '')
                .toLowerCase()
                .includes(input.toLowerCase()),
          }}
          placeholder={
            productOptions.length > 0
              ? '请选择优迈货品资料'
              : '暂无优迈货品资料，请先维护货品资料'
          }
          options={productOptions.map((item) => ({
            value: item.id,
            label: `${item.material_code} | ${item.material_name} | ${item.model} | ${item.specification}`,
          }))}
        />
      </Form.Item>

      <div className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 md:grid-cols-2">
        <div>
          <div className="text-xs text-slate-400">物料编码</div>
          <div>{selectedProduct?.material_code || '-'}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">物料名称</div>
          <div>{selectedProduct?.material_name || '-'}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">型号</div>
          <div>{selectedProduct?.model || '-'}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">规格</div>
          <div>{selectedProduct?.specification || '-'}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">比重</div>
          <div>
            {selectedProduct
              ? Number(selectedProduct.specific_gravity).toFixed(6)
              : '-'}
          </div>
        </div>
      </div>

      <Form.Item name="pending_stock_in" hidden>
        <InputNumber />
      </Form.Item>

      <Form.Item name="pending_stock_out" hidden>
        <InputNumber />
      </Form.Item>

      <Form.Item
        name="current_stock"
        label="现有库存"
        rules={[{ required: true, message: '请输入现有库存' }]}
      >
        <InputNumber
          min={0}
          step={0.001}
          precision={3}
          style={{ width: '100%' }}
          placeholder="请输入现有库存"
        />
      </Form.Item>

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
