import { useEffect } from 'react'
import { Button, Form, Input, Select, Space } from 'antd'

import {
  QUALITY_REWORK_REPAIR_CATEGORIES,
  type QualityReworkRepairCategory,
} from '@/services/apiQualityReworkRepair'

interface SearchValues {
  keyword?: string
  reworkCategory?: QualityReworkRepairCategory
}

interface Props {
  onSearch: (params: {
    keyword?: string
    reworkCategory?: QualityReworkRepairCategory
  }) => void
  onReset: () => void
  initialValues?: {
    keyword?: string
    reworkCategory?: QualityReworkRepairCategory
  }
}

export default function ReworkRepairSearch({
  onSearch,
  onReset,
  initialValues,
}: Props) {
  const [form] = Form.useForm<SearchValues>()

  useEffect(() => {
    form.setFieldsValue({
      keyword: initialValues?.keyword,
      reworkCategory: initialValues?.reworkCategory,
    })
  }, [form, initialValues])

  const handleSearch = (values: SearchValues) => {
    onSearch({
      keyword: values.keyword?.trim() || undefined,
      reworkCategory: values.reworkCategory,
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
      <Form.Item name="reworkCategory" className="mb-0" style={{ width: 220 }}>
        <Select
          allowClear
          placeholder="请选择返工返修类别"
          options={QUALITY_REWORK_REPAIR_CATEGORIES.map((item) => ({
            value: item,
            label: item,
          }))}
        />
      </Form.Item>

      <Form.Item name="keyword" className="mb-0" style={{ width: 420 }}>
        <Input
          placeholder="请输入编号、产品、规格、责任单位或描述"
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
