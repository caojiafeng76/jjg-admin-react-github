import { DatePicker, Form, Input, InputNumber, Select, Switch } from 'antd'

export interface ProductionOrderFormBaseFieldsProps {
  compact: boolean
  employees: { id: string; name: string }[]
  fixedEmployee?: { id: string; name: string } | null
  showAuditField: boolean
}

export default function ProductionOrderFormBaseFields({
  compact,
  employees,
  fixedEmployee,
  showAuditField,
}: ProductionOrderFormBaseFieldsProps) {
  return (
    <div
      className={compact ? 'grid grid-cols-1 gap-3' : 'grid grid-cols-4 gap-4'}
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
          disabled={Boolean(fixedEmployee)}
          filterOption={(input, option) => {
            if (!option) return false
            const label = option.label?.toString() ?? ''
            return label.toLowerCase().includes(input.toLowerCase())
          }}
          options={employees.map((emp) => ({
            label: emp.name,
            value: emp.id,
          }))}
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item
        name="shift"
        label="班别"
        rules={[{ required: true, message: '请选择班别' }]}
      >
        <Select
          placeholder="请选择班别"
          options={[
            { label: '白班', value: '白班' },
            { label: '夜班', value: '夜班' },
          ]}
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item
        name="work_hours"
        label="出勤工时(小时)"
        rules={[{ required: true, message: '请输入出勤工时' }]}
      >
        <InputNumber
          min={0}
          step={0.5}
          style={{ width: '100%' }}
          placeholder="请输入出勤工时"
        />
      </Form.Item>

      <Form.Item
        name="extra_qualified_hours"
        label="零工工时(小时)"
        tooltip="按小时录入，会直接计入工单总合格工时"
      >
        <InputNumber
          min={0}
          step={0.5}
          precision={2}
          style={{ width: '100%' }}
          placeholder="例如 1.5"
        />
      </Form.Item>

      {showAuditField ? (
        <Form.Item name="is_audited" label="审核状态" valuePropName="checked">
          <Switch checkedChildren="已审核" unCheckedChildren="待审核" />
        </Form.Item>
      ) : null}

      <Form.Item
        name="remark"
        label="备注"
        className={compact ? undefined : 'col-span-4'}
      >
        <Input.TextArea rows={2} placeholder="请输入备注" />
      </Form.Item>
    </div>
  )
}
