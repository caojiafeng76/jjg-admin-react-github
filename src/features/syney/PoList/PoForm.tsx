import type { ISyneySpec } from '@services/types'
import type { TransformedOrderData } from '@utils/excelUtils'
import type { FormInstance } from 'antd'
import type { FC } from 'react'
import type { ISyneyPo } from '@/types'
import { DatePicker, Form, Input, Select } from 'antd'
import dayjs from 'dayjs'
import { memo, useEffect } from 'react'
import { SYNEY_LOOSE_PARTS_SPEC, SYNEY_SPEC_OPTIONS } from '@/utils/syneyOrderDefaults'
import ExcelUpload from './ExcelUpload'

interface PoFormProps {
  onFinish: (values: ISyneyPo) => void
  setFormRef: (form: FormInstance<ISyneyPo>) => void
  isCreating: boolean
  isEdit: boolean
  importMode: 'manual' | 'excel'
  initialValues?: ISyneyPo
  onExcelDataChange?: (data: TransformedOrderData) => void
  syneySpecs: ISyneySpec[]
  specsLoading?: boolean
}

const SPEC_OPTIONS = SYNEY_SPEC_OPTIONS.map(spec => ({
  value: spec,
  label: spec,
}))

const PoForm: FC<PoFormProps> = ({
  onFinish,
  setFormRef,
  isCreating,
  isEdit,
  importMode,
  initialValues,
  onExcelDataChange,
  syneySpecs,
  specsLoading = false,
}) => {
  const [form] = Form.useForm<ISyneyPo>()

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues)
      return
    }
    form.resetFields()
  }, [form, initialValues])

  const handleExcelDataParsed = (data: TransformedOrderData) => {
    form.setFieldsValue({
      No: data.po.No,
      EndDate: data.po.EndDate ? dayjs(data.po.EndDate) : null,
      Remark: data.po.Remark || '',
      Spec: data.po.Spec || undefined,
      Brand: data.po.Brand || undefined,
    } as Partial<ISyneyPo>)

    if (onExcelDataChange) {
      onExcelDataChange(data)
    }
  }

  const fieldClassName = 'rounded-lg'

  return (
    <Form
      form={form}
      layout="vertical"
      name="po-form"
      disabled={isCreating}
      onFinish={onFinish}
    >
      <Form.Item
        name="No"
        label="订单号"
        rules={[{ required: true, message: '请输入订单号' }]}
      >
        <Input
          disabled={isCreating || importMode === 'excel'}
          className={fieldClassName}
          placeholder="请输入订单号"
        />
      </Form.Item>
      <Form.Item name="Spec" label="规格">
        <Select
          disabled={isCreating}
          options={SPEC_OPTIONS}
          placeholder="留空则自动推断"
          allowClear
          getPopupContainer={() => document.body}
          className={fieldClassName}
        />
      </Form.Item>
      <Form.Item
        name="EndDate"
        label="交货日期"
        rules={[{ required: true, message: '请选择交货日期' }]}
      >
        <DatePicker
          disabled={isCreating || importMode === 'excel'}
          className={`${fieldClassName} w-full`}
        />
      </Form.Item>

      {!isEdit && (
        <>
          {importMode === 'manual' && (
            <Form.Item
              name="Detail"
              label="详情"
              rules={[{ required: true, message: '请粘贴订单明细数据' }]}
            >
              <Input.TextArea
                rows={14}
                disabled={isCreating}
                className={fieldClassName}
                placeholder="粘贴或输入订单明细 JSON 字符串"
              />
            </Form.Item>
          )}

          {importMode === 'excel' && (
            <>
              <Form.Item label="上传文件">
                <ExcelUpload
                  onDataParsed={handleExcelDataParsed}
                  disabled={isCreating}
                  syneySpecs={syneySpecs}
                  specsLoading={specsLoading}
                />
              </Form.Item>
              <Form.Item name="Remark" label="备注">
                <Input.TextArea
                  rows={3}
                  disabled={isCreating}
                  className={fieldClassName}
                />
              </Form.Item>
            </>
          )}
        </>
      )}

      {isEdit && (
        <>
          <Form.Item name="BorderMaterial" label="围框材质">
            <Select
              disabled={isCreating}
              options={[
                { label: '橡胶', value: '橡胶' },
                { label: '尼龙', value: '尼龙' },
              ]}
              getPopupContainer={() => document.body}
              className={fieldClassName}
            />
          </Form.Item>
          <Form.Item
            shouldUpdate={(prev, cur) => prev.Spec !== cur.Spec}
            noStyle
          >
            {({ getFieldValue }) => {
              const isLooseParts = getFieldValue('Spec') === SYNEY_LOOSE_PARTS_SPEC
              return (
                <Form.Item
                  name="Brand"
                  label="商标"
                  rules={isLooseParts ? [] : [{ required: true, message: '请输入商标' }]}
                >
                  <Input
                    disabled={isCreating}
                    placeholder={isLooseParts ? '散件订单可留空' : undefined}
                    className={fieldClassName}
                  />
                </Form.Item>
              )
            }}
          </Form.Item>
          <Form.Item name="Technique" label="工艺要求">
            <Input disabled={isCreating} className={fieldClassName} />
          </Form.Item>
          <Form.Item name="Remark" label="备注">
            <Input disabled={isCreating} className={fieldClassName} />
          </Form.Item>
          <Form.Item
            name="DeliveryNo"
            label="送货单号"
            extra="西尼 SCM 送货单号，生成送货单后自动回写；可修改或清空"
          >
            <Input
              disabled={isCreating}
              allowClear
              placeholder="未生成送货单时留空"
              className={fieldClassName}
            />
          </Form.Item>
        </>
      )}
    </Form>
  )
}

export default memo(PoForm)
