import { useEffect } from 'react'
import { Button, Form, Input, Space } from 'antd'

interface Props {
  onSearch: (keyword?: string) => void
  onReset: () => void
  keyword?: string
}

export default function JintanPartsStockOutSearch({
  onSearch,
  onReset,
  keyword,
}: Props) {
  const [form] = Form.useForm<{ keyword?: string }>()
  useEffect(() => form.setFieldsValue({ keyword }), [form, keyword])

  return (
    <Form
      form={form}
      onFinish={(values) => onSearch(values.keyword?.trim() || undefined)}
      className="flex flex-1 flex-wrap items-center gap-3"
    >
      <Form.Item name="keyword" className="mb-0" style={{ width: 360 }}>
        <Input
          placeholder="请输入名称、规格、材质或采购厂家"
          allowClear
          onPressEnter={() => form.submit()}
        />
      </Form.Item>
      <Form.Item className="mb-0">
        <Space>
          <Button type="primary" htmlType="submit">
            搜索
          </Button>
          <Button
            onClick={() => {
              form.resetFields()
              onReset()
            }}
          >
            重置
          </Button>
        </Space>
      </Form.Item>
    </Form>
  )
}
