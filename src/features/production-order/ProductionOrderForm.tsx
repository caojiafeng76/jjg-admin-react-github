import { useEffect } from 'react'
import { Modal, Form, InputNumber, Select, Input, DatePicker } from 'antd'
import dayjs from 'dayjs'

import type { ProductionOrder } from '@/services/apiProductionOrders'

interface Props {
  open: boolean
  onCancel: () => void
  onSubmit: (values: Partial<ProductionOrder>) => void
  initialValues?: ProductionOrder
  employees: { id: string; name: string }[]
}

const STATUS_OPTIONS = [
  { label: '进行中', value: '进行中' },
  { label: '已完成', value: '已完成' },
  { label: '已取消', value: '已取消' },
]

export default function ProductionOrderForm({
  open,
  onCancel,
  onSubmit,
  initialValues,
  employees,
}: Props) {
  const [form] = Form.useForm()

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        order_date: initialValues.order_date
          ? dayjs(initialValues.order_date)
          : undefined,
      })
    } else {
      form.resetFields()
      form.setFieldsValue({
        order_date: dayjs().subtract(1, 'day'),
        work_hours: 8,
        status: '进行中',
      })
    }
  }, [initialValues, form, open])

  const handleFinish = (values: {
    order_date: dayjs.Dayjs
    work_hours: number
    status: string
    remark?: string
    employee_id: string
  }) => {
    onSubmit({
      ...values,
      order_date: values.order_date.format('YYYY-MM-DD'),
    })
    form.resetFields()
  }

  return (
    <Modal
      title={initialValues ? '编辑生产工单' : '创建生产工单'}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      width={500}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          order_date: dayjs().subtract(1, 'day'),
          work_hours: 8,
          status: '进行中',
        }}
      >
        <Form.Item
          name="order_date"
          label="日期"
          rules={[{ required: true, message: '请选择日期' }]}
        >
          <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
        </Form.Item>

        <Form.Item
          name="employee_id"
          label="操作人"
          rules={[{ required: true, message: '请选择操作人' }]}
        >
          <Select
            showSearch
            placeholder="请选择操作人"
            optionFilterProp="children"
            options={employees.map((emp) => ({
              label: emp.name,
              value: emp.id,
            }))}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          name="work_hours"
          label="出勤工时(小时)"
          rules={[{ required: true, message: '请输入出勤工时' }]}
        >
          <InputNumber
            min={0.01}
            step={0.5}
            style={{ width: '100%' }}
            placeholder="请输入出勤工时(小时)"
          />
        </Form.Item>

        <Form.Item
          name="status"
          label="状态"
          rules={[{ required: true, message: '请选择状态' }]}
        >
          <Select
            placeholder="请选择状态"
            options={STATUS_OPTIONS}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={3} placeholder="请输入备注" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
