import { Button, DatePicker, Form, Input, Space } from 'antd'
import dayjs from 'dayjs'

import type { MachineRuntimeFilters } from '@/services/apiMachineRuntime'

const { RangePicker } = DatePicker

interface Props {
  onSearch: (
    filters: Omit<
      MachineRuntimeFilters,
      'page' | 'pageSize' | 'machineEquipmentId'
    >,
  ) => void
  onReset: () => void
}

export default function MachineRuntimeSearch({ onSearch, onReset }: Props) {
  const [form] = Form.useForm()

  const handleFinish = (values: {
    dateRange?: [dayjs.Dayjs, dayjs.Dayjs]
    unifiedDeviceNo?: string
    deviceOperation?: string
    machineName?: string
  }) => {
    onSearch({
      dateFrom: values.dateRange?.[0]?.format('YYYY-MM-DD'),
      dateTo: values.dateRange?.[1]?.format('YYYY-MM-DD'),
      unifiedDeviceNo: values.unifiedDeviceNo?.trim() || undefined,
      deviceOperation: values.deviceOperation?.trim() || undefined,
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
      layout="inline"
      onFinish={handleFinish}
      className="flex flex-wrap gap-2"
      initialValues={{
        dateRange: [dayjs().subtract(30, 'day'), dayjs()],
      }}
    >
      <Form.Item name="dateRange" label="日期范围">
        <RangePicker format="YYYY-MM-DD" allowClear style={{ width: 240 }} />
      </Form.Item>

      <Form.Item name="unifiedDeviceNo" label="统一设备编号">
        <Input placeholder="请输入" allowClear style={{ width: 140 }} />
      </Form.Item>

      <Form.Item name="deviceOperation" label="工序">
        <Input placeholder="请输入" allowClear style={{ width: 120 }} />
      </Form.Item>

      <Form.Item name="machineName" label="机器名称">
        <Input placeholder="请输入" allowClear style={{ width: 120 }} />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit">
            查询
          </Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </Form.Item>
    </Form>
  )
}
