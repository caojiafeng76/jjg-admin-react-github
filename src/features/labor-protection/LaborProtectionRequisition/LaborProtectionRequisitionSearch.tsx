import { useEffect } from 'react'
import { Button, Form, Input, Select, Space } from 'antd'

import type { LaborProtectionDataOption } from '@/services/apiLaborProtectionData'

interface SearchValues {
  keyword?: string
  categoryId?: string
}

interface Props {
  onSearch: (params: { keyword?: string; categoryId?: string }) => void
  onReset: () => void
  initialValues?: { keyword?: string; categoryId?: string }
  categoryOptions: LaborProtectionDataOption[]
  isCategoryOptionsLoading: boolean
}

export default function LaborProtectionRequisitionSearch({
  onSearch,
  onReset,
  initialValues,
  categoryOptions,
  isCategoryOptionsLoading,
}: Props) {
  const [form] = Form.useForm<SearchValues>()

  useEffect(() => {
    form.setFieldsValue({
      keyword: initialValues?.keyword,
      categoryId: initialValues?.categoryId,
    })
  }, [form, initialValues])

  const handleSearch = (values: SearchValues) => {
    onSearch({
      keyword: values.keyword?.trim() || undefined,
      categoryId: values.categoryId || undefined,
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
      className="flex flex-1 flex-wrap gap-2"
    >
      <Form.Item name="categoryId" className="mb-0" style={{ width: 240 }}>
        <Select
          allowClear
          loading={isCategoryOptionsLoading}
          showSearch={{
            filterOption: (input, option) =>
              String(option?.label || '')
                .toLowerCase()
                .includes(input.toLowerCase()),
          }}
          placeholder="请选择劳保种类"
          options={categoryOptions.map((item) => ({
            value: item.id,
            label: item.category,
          }))}
        />
      </Form.Item>
      <Form.Item name="keyword" className="mb-0" style={{ width: 320 }}>
        <Input
          placeholder="请输入岗位或领取人"
          allowClear
          onPressEnter={() => form.submit()}
        />
      </Form.Item>
      <Form.Item className="mb-0">
        <Space>
          <Button type="primary" htmlType="submit">
            搜索
          </Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </Form.Item>
    </Form>
  )
}
