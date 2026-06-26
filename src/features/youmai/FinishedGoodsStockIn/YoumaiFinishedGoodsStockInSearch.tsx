import { useEffect } from 'react'
import { Button, Form, Input, Select, Space } from 'antd'

interface SearchValues {
  keyword?: string
  status?: '待审核' | '已审核'
}

interface Props {
  onSearch: (params: { keyword?: string; status?: '待审核' | '已审核' }) => void
  onReset: () => void
  initialValues?: { keyword?: string; status?: '待审核' | '已审核' }
}

export default function YoumaiFinishedGoodsStockInSearch({
  onSearch,
  onReset,
  initialValues,
}: Props) {
  const [form] = Form.useForm<SearchValues>()

  useEffect(() => {
    form.setFieldsValue({
      keyword: initialValues?.keyword,
      status: initialValues?.status,
    })
  }, [form, initialValues])

  const handleSearch = (values: SearchValues) => {
    onSearch({
      keyword: values.keyword?.trim() || undefined,
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
      <Form.Item name="keyword" className="mb-0" style={{ width: 320 }}>
        <Input
          placeholder="请输入物料编码、名称、型号、规格或备注"
          allowClear
          onPressEnter={() => form.submit()}
          className="rounded-lg"
        />
      </Form.Item>
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
          <Button type="primary" htmlType="submit" className="rounded-lg font-medium shadow-sm">
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
