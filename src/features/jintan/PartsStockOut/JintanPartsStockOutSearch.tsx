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
  keyword?: string
  itemType?: JintanItemType
}

export default function JintanPartsStockOutSearch({
  onSearch,
  onReset,
  keyword,
  itemType,
}: Props) {
  const [form] = Form.useForm<SearchValues>()
  useEffect(
    () => form.setFieldsValue({ keyword, itemType }),
    [form, keyword, itemType],
  )

  return (
    <Form
      form={form}
      onFinish={values =>
        onSearch({
          keyword: values.keyword?.trim() || undefined,
          itemType: values.itemType,
        })}
      className="flex flex-1 flex-wrap items-center gap-3"
    >
      <Form.Item name="keyword" className="mb-0" style={{ width: 360 }}>
        <Input
          placeholder="请输入名称、规格、材质或采购厂家"
          allowClear
          onPressEnter={() => form.submit()}
        />
      </Form.Item>
      <JintanItemTypeFilterItem />
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
