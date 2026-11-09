import type { JintanItemType } from '@/services/jintanItemType'
import { Button, Form, Input, Space } from 'antd'
import { useEffect } from 'react'
import JintanItemTypeFilterItem from '../JintanItemTypeFilterItem'

interface SearchValues {
  keyword?: string
  itemType?: JintanItemType
}

interface Props {
  onSearch: (params: SearchValues) => void
  onReset: () => void
  initialValues?: SearchValues
}

export default function JintanProfilesInventorySearch({
  onSearch,
  onReset,
  initialValues,
}: Props) {
  const [form] = Form.useForm<SearchValues>()

  useEffect(() => {
    form.setFieldsValue({
      keyword: initialValues?.keyword,
      itemType: initialValues?.itemType,
    })
  }, [form, initialValues])

  const handleSearch = (values: SearchValues) => {
    onSearch({
      keyword: values.keyword?.trim() || undefined,
      itemType: values.itemType,
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
          placeholder="请输入型号、名称、规格、颜色或材质"
          allowClear
          onPressEnter={() => form.submit()}
          className="rounded-lg"
        />
      </Form.Item>
      <JintanItemTypeFilterItem />
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
