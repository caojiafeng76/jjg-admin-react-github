import { FC, Ref, memo, useState } from 'react'
import { DatePicker, Form, FormInstance, Input, Select, Radio } from 'antd'
import { ISyneyPo } from '@/types'
import ExcelUpload from './ExcelUpload'
import { TransformedOrderData } from '@utils/excelUtils'
import dayjs from 'dayjs'

type PoFormProps = {
  onFinish: (values: ISyneyPo) => void
  isCreating: boolean
  isEdit: boolean
  ref: Ref<FormInstance<ISyneyPo>> | undefined
  initialValues?: ISyneyPo
  onExcelDataChange?: (data: TransformedOrderData) => void
}

const layout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 20 },
}

// 规格选项
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
}) => {
  // 导入方式: 'manual' | 'excel'
  const [importMode, setImportMode] = useState<'manual' | 'excel'>('manual')

  /**
   * 处理Excel数据解析完成
   */
  const handleExcelDataParsed = (data: TransformedOrderData) => {
    // 自动填充表单字段
    if (ref && 'current' in ref && ref.current) {
      ref.current.setFieldsValue({
        No: data.po.No,
        EndDate: data.po.EndDate ? dayjs(data.po.EndDate) : null,
        Remark: data.po.Remark || '',
      })
    }

    // 通知父组件Excel数据已解析
    if (onExcelDataChange) {
      onExcelDataChange(data)
    }
  }

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
        <Input disabled={isCreating || importMode === 'excel'} />
      </Form.Item>
      <Form.Item name="Spec" label="规格">
        <Select
          disabled={isCreating}
          options={SPEC_OPTIONS}
          placeholder="留空则自动推断"
          allowClear
        />
      </Form.Item>
      <Form.Item name="EndDate" label="交货日期" rules={[{ required: true }]}>
        <DatePicker disabled={isCreating || importMode === 'excel'} />
      </Form.Item>

      {/* 新增：导入方式选择 (仅在新建时显示) */}
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

          {/* 手动输入模式 */}
          {importMode === 'manual' && (
            <Form.Item name="Detail" label="详情" rules={[{ required: true }]}>
              <Input.TextArea rows={20} cols={30} disabled={isCreating} />
            </Form.Item>
          )}

          {/* Excel导入模式 */}
          {importMode === 'excel' && (
            <Form.Item label="上传文件">
              <ExcelUpload
                onDataParsed={handleExcelDataParsed}
                disabled={isCreating}
              />
            </Form.Item>
          )}
        </>
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
