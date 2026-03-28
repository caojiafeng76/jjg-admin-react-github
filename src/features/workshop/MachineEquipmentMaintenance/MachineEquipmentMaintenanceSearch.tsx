import { Button, Form, Input, Space } from 'antd'
import { useEffect } from 'react'

interface SearchValues {
  unifiedDeviceNo?: string
  operation?: string
  machineName?: string
}

interface Props {
  onSearch: (params: SearchValues) => void
  onReset: () => void
  initialValues?: SearchValues
}

export default function MachineEquipmentMaintenanceSearch({
  onSearch,
  onReset,
  initialValues,
}: Props) {
  const [form] = Form.useForm<SearchValues>()

  useEffect(() => {
    form.setFieldsValue({
      unifiedDeviceNo: initialValues?.unifiedDeviceNo,
      operation: initialValues?.operation,
      machineName: initialValues?.machineName,
    })
  }, [form, initialValues])

  const handleSearch = (values: SearchValues) => {
    onSearch({
      unifiedDeviceNo: values.unifiedDeviceNo?.trim() || undefined,
      operation: values.operation?.trim() || undefined,
      machineName: values.machineName?.trim() || undefined,
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
      <Form.Item name="unifiedDeviceNo" className="mb-0" style={{ width: 220 }}>
        <Input
          placeholder="请输入统一设备编号"
          allowClear
          onPressEnter={() => form.submit()}
        />
      </Form.Item>
      <Form.Item name="operation" className="mb-0" style={{ width: 220 }}>
        <Input
          placeholder="请输入工序"
          allowClear
          onPressEnter={() => form.submit()}
        />
      </Form.Item>
      <Form.Item name="machineName" className="mb-0" style={{ width: 220 }}>
        <Input
          placeholder="请输入机器名称"
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
