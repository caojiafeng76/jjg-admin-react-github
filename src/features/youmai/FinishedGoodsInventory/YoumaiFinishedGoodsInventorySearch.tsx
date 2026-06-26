import { useEffect } from 'react'
import { Button, Form, Input, Space } from 'antd'

interface SearchValues {
  keyword?: string
}

interface Props {
  onSearch: (params: { keyword?: string }) => void
  onReset: () => void
  initialValues?: { keyword?: string }
}

export default function YoumaiFinishedGoodsInventorySearch({
  onSearch,
  onReset,
  initialValues,
}: Props) {
  const [form] = Form.useForm<SearchValues>()

  useEffect(() => {
    form.setFieldsValue({
      keyword: initialValues?.keyword,
    })
  }, [form, initialValues])

  const handleSearch = (values: SearchValues) => {
    onSearch({
      keyword: values.keyword?.trim() || undefined,
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
      <Form.Item name="keyword" className="mb-0" style={{ width: 360 }}>
        <Input
          placeholder="请输入物料编码、名称、型号、规格或备注"
          allowClear
          onPressEnter={() => form.submit()}
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
