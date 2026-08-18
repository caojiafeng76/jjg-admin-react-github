import { useEffect } from 'react'
import { Button, Form, Input, Select, Space } from 'antd'

const SEARCH_FIELDS = [
  { name: 'purchaseOrderNo', placeholder: '采购订单号', width: 150 },
  { name: 'materialCode', placeholder: '物料编码', width: 130 },
  { name: 'materialName', placeholder: '物料名称', width: 140 },
  { name: 'model', placeholder: '型号', width: 110 },
  { name: 'specification', placeholder: '规格', width: 140 },
  { name: 'remarks', placeholder: '备注', width: 160 },
] as const

interface SearchValues {
  purchaseOrderNo?: string
  materialCode?: string
  materialName?: string
  model?: string
  specification?: string
  remarks?: string
  status?: '待审核' | '已审核'
}

interface Props {
  onSearch: (params: SearchValues) => void
  onReset: () => void
  initialValues?: SearchValues
}

export default function YoumaiFinishedGoodsStockOutSearch({
  onSearch,
  onReset,
  initialValues,
}: Props) {
  const [form] = Form.useForm<SearchValues>()

  useEffect(() => {
    form.setFieldsValue({
      purchaseOrderNo: initialValues?.purchaseOrderNo,
      materialCode: initialValues?.materialCode,
      materialName: initialValues?.materialName,
      model: initialValues?.model,
      specification: initialValues?.specification,
      remarks: initialValues?.remarks,
      status: initialValues?.status,
    })
  }, [form, initialValues])

  const handleSearch = (values: SearchValues) => {
    onSearch({
      purchaseOrderNo: values.purchaseOrderNo?.trim() || undefined,
      materialCode: values.materialCode?.trim() || undefined,
      materialName: values.materialName?.trim() || undefined,
      model: values.model?.trim() || undefined,
      specification: values.specification?.trim() || undefined,
      remarks: values.remarks?.trim() || undefined,
      status: values.status,
    })
  }

  const handleReset = () => {
    form.resetFields()
    onReset()
  }

  return (
    <Form
      form={form}
      onFinish={handleSearch}
      className="flex flex-1 flex-wrap items-center gap-3"
    >
      {SEARCH_FIELDS.map((field) => (
        <Form.Item
          key={field.name}
          name={field.name}
          className="mb-0"
          style={{ width: field.width }}
        >
          <Input
            placeholder={field.placeholder}
            allowClear
            onPressEnter={() => form.submit()}
            className="rounded-lg"
          />
        </Form.Item>
      ))}
      <Form.Item name="status" className="mb-0" style={{ width: 160 }}>
        <Select
          allowClear
          placeholder="全部状态"
          options={[
            { value: '待审核', label: '待审核' },
            { value: '已审核', label: '已审核' },
          ]}
          className="rounded-lg"
        />
      </Form.Item>
      <Form.Item className="mb-0">
        <Space>
          <Button
            type="primary"
            htmlType="submit"
            className="rounded-lg font-medium shadow-sm"
          >
            搜索
          </Button>
          <Button onClick={handleReset} className="rounded-lg">
            重置
          </Button>
        </Space>
      </Form.Item>
    </Form>
  )
}