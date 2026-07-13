import { FC, Ref, memo, useState } from 'react'
import { DatePicker, Form, FormInstance, Input, Select, Radio } from 'antd'
import { ISyneyPo } from '@/types'
import ExcelUpload from './ExcelUpload'
import type { TransformedOrderData } from '@utils/excelUtils'
import dayjs from 'dayjs'
import type { ISyneySpec } from '@services/types'

type PoFormProps = {
  onFinish: (values: ISyneyPo) => void
  isCreating: boolean
  isEdit: boolean
  ref: Ref<FormInstance<ISyneyPo>> | undefined
  initialValues?: ISyneyPo
  onExcelDataChange?: (data: TransformedOrderData) => void
  syneySpecs: ISyneySpec[]
  specsLoading?: boolean
}

const layout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 18 },
}

const SPEC_OPTIONS = [
  { value: '1000型-室内-扶梯', label: <span>1000型-室内-扶梯</span> },
  { value: '1000型-室外-扶梯', label: <span>1000型-室外-扶梯</span> },
  { value: '1000型-室内-人行道', label: <span>1000型-室内-人行道</span> },
  { value: '1000型-室外-人行道', label: <span>1000型-室外-人行道</span> },
  { value: '800型-室内-扶梯', label: <span>800型-室内-扶梯</span> },
  { value: '800型-室外-扶梯', label: <span>800型-室外-扶梯</span> },
  { value: '800型-室内-人行道', label: <span>800型-室内-人行道</span> },
  { value: '800型-室外-人行道', label: <span>800型-室外-人行道</span> },
  { value: '600型-室内-扶梯', label: <span>600型-室内-扶梯</span> },
  { value: '600型-室外-扶梯', label: <span>600型-室外-扶梯</span> },
  { value: '1000型-室内-老围框', label: <span>1000型-室内-老围框</span> },
  { value: '800型-室内-老围框', label: <span>800型-室内-老围框</span> },
  { value: '600型-室内-老围框', label: <span>600型-室内-老围框</span> },
]

const PoForm: FC<PoFormProps> = ({
  onFinish,
  isCreating,
  isEdit,
  ref,
  initialValues,
  onExcelDataChange,
  syneySpecs,
  specsLoading = false,
}) => {
  const [importMode, setImportMode] = useState<'manual' | 'excel'>('manual')

  const handleExcelDataParsed = (data: TransformedOrderData) => {
    if (ref && 'current' in ref && ref.current) {
      ref.current.setFieldsValue({
        No: data.po.No,
        EndDate: data.po.EndDate ? dayjs(data.po.EndDate) : null,
        Remark: data.po.Remark || '',
        Spec: data.po.Spec || undefined,
        Brand: data.po.Brand || undefined,
      } as Partial<ISyneyPo>)
    }

    if (onExcelDataChange) {
      onExcelDataChange(data)
    }
  }

  const fieldClassName = 'rounded-lg'

  return (
    <Form
      ref={ref}
      {...layout}
      name="po-form"
      onFinish={onFinish}
      initialValues={initialValues}
      className="[&_.ant-form-item]:mb-3"
    >
      <Form.Item name="No" label="订单号" rules={[{ required: true }]}>
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
      <Form.Item name="EndDate" label="交货日期" rules={[{ required: true }]}>
        <DatePicker
          disabled={isCreating || importMode === 'excel'}
          className={`${fieldClassName} w-full`}
        />
      </Form.Item>

      {!isEdit && (
        <>
          <Form.Item label="导入方式">
            <Radio.Group
              value={importMode}
              onChange={(e) => setImportMode(e.target.value)}
              disabled={isCreating}
            >
              <Radio value="manual">手动输入</Radio>
              <Radio value="excel">Excel导入</Radio>
            </Radio.Group>
          </Form.Item>

          {importMode === 'manual' && (
            <Form.Item name="Detail" label="详情" rules={[{ required: true }]}>
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
          <Form.Item name="Brand" label="商标" rules={[{ required: true }]}>
            <Input disabled={isCreating} className={fieldClassName} />
          </Form.Item>
          <Form.Item name="Technique" label="工艺要求">
            <Input disabled={isCreating} className={fieldClassName} />
          </Form.Item>
          <Form.Item name="Remark" label="备注">
            <Input disabled={isCreating} className={fieldClassName} />
          </Form.Item>
        </>
      )}
    </Form>
  )
}

export default memo(PoForm)
