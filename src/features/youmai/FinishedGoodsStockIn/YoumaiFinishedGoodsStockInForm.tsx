import { useEffect, useMemo } from 'react'
import {
  Alert,
  Form,
  type FormInstance,
  Input,
  InputNumber,
  Select,
} from 'antd'

import type {
  YoumaiFinishedGoodsStockIn,
  YoumaiFinishedGoodsStockInFormValues,
  YoumaiProductDataOption,
} from '@/services/apiYoumaiFinishedGoodsStockIn'

interface Props {
  onFinish: (values: YoumaiFinishedGoodsStockInFormValues) => void
  setFormRef: (form: FormInstance<YoumaiFinishedGoodsStockInFormValues>) => void
  isSubmitting: boolean
  productOptions: YoumaiProductDataOption[]
  initialValues?:
    | YoumaiFinishedGoodsStockIn
    | YoumaiFinishedGoodsStockInFormValues
  isAuditLocked?: boolean
}

const DEFAULT_VALUES: YoumaiFinishedGoodsStockInFormValues = {
  product_data_id: '',
  status: '待审核',
  stock_in_quantity: 0,
  remarks: '',
}

export default function YoumaiFinishedGoodsStockInForm({
  onFinish,
  setFormRef,
  isSubmitting,
  productOptions,
  initialValues,
  isAuditLocked = false,
}: Props) {
  const [form] = Form.useForm<YoumaiFinishedGoodsStockInFormValues>()
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
        status: initialValues.status,
        stock_in_quantity: Number(initialValues.stock_in_quantity || 0),
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
      {isAuditLocked && (
        <Alert
          className="mb-4"
          type="info"
          showIcon
          message="当前记录已审核，仅允许修改备注。货品、状态和入库数量已锁定。"
        />
      )}

      <Form.Item
        name="product_data_id"
        label="关联货品资料"
        rules={[{ required: true, message: '请选择货品资料' }]}
      >
        <Select
          disabled={isAuditLocked}
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Form.Item
          name="status"
          label="状态"
          rules={[{ required: true, message: '请选择状态' }]}
        >
          <Select
            disabled={isAuditLocked}
            options={[
              { value: '待审核', label: '待审核' },
              { value: '已审核', label: '已审核' },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="stock_in_quantity"
          label="入库数量"
          rules={[{ required: true, message: '请输入入库数量' }]}
        >
          <InputNumber
            disabled={isAuditLocked}
            min={0.001}
            step={0.001}
            precision={3}
            style={{ width: '100%' }}
            placeholder="请输入入库数量"
          />
        </Form.Item>
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
