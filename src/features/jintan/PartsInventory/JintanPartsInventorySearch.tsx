import { useEffect } from 'react'
import { Button, Form, Input, Select, Space } from 'antd'

import type { JintanPartsStockStatus } from '@/services/apiJintanPartsInventory'
import { JINTAN_PARTS_STOCK_STATUS_OPTIONS } from './stockStatus'

export interface JintanPartsInventorySearchValues {
  keyword?: string
  status?: JintanPartsStockStatus
}

interface Props {
  onSearch: (params: JintanPartsInventorySearchValues) => void
  onReset: () => void
  initialValues?: JintanPartsInventorySearchValues
}

export default function JintanPartsInventorySearch({
  onSearch,
  onReset,
  initialValues,
}: Props) {
  const [form] = Form.useForm<JintanPartsInventorySearchValues>()

  useEffect(() => {
    form.setFieldsValue({
      keyword: initialValues?.keyword,
      status: initialValues?.status,
    })
  }, [form, initialValues])

  const handleSearch = (values: JintanPartsInventorySearchValues) => {
    onSearch({
      keyword: values.keyword?.trim() || undefined,
      status: values.status || undefined,
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
          placeholder="请输入名称、规格、材质或采购厂家"
          allowClear
          onPressEnter={() => form.submit()}
          className="rounded-lg"
        />
      </Form.Item>
      <Form.Item name="status" className="mb-0" style={{ width: 160 }}>
        <Select
          placeholder="库存状态"
          allowClear
          options={JINTAN_PARTS_STOCK_STATUS_OPTIONS}
          onChange={() => form.submit()}
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
