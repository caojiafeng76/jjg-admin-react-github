import { useEffect } from 'react'
import { Form, type FormInstance, Input, InputNumber } from 'antd'

import type {
  PackagingEmployee,
  PackagingEmployeeFormValues,
} from '@/services/apiPackagingEmployees'

interface Props {
  onFinish: (values: PackagingEmployeeFormValues) => void
  setFormRef: (form: FormInstance<PackagingEmployeeFormValues>) => void
  isSubmitting: boolean
  initialValues?: PackagingEmployee | PackagingEmployeeFormValues
}

const DEFAULT_VALUES: PackagingEmployeeFormValues = {
  username: '',
  name: '',
  position_salary: null,
  remark: null,
}

export default function EmployeeForm({
  onFinish,
  setFormRef,
  isSubmitting,
  initialValues,
}: Props) {
  const [form] = Form.useForm<PackagingEmployeeFormValues>()

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...DEFAULT_VALUES,
        username: initialValues.username,
        name: initialValues.name,
        position_salary: initialValues.position_salary,
        remark: initialValues.remark,
      })
      return
    }

    form.resetFields()
    form.setFieldsValue(DEFAULT_VALUES)
  }, [form, initialValues])

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      disabled={isSubmitting}
    >
      <Form.Item
        name="username"
        label="用户名"
        rules={[
          { required: true, message: '请输入用户名' },
          { max: 100, message: '用户名不能超过 100 个字符' },
        ]}
      >
        <Input placeholder="请输入用户名" allowClear />
      </Form.Item>

      <Form.Item
        name="name"
        label="姓名"
        rules={[
          { required: true, message: '请输入姓名' },
          { max: 100, message: '姓名不能超过 100 个字符' },
        ]}
      >
        <Input placeholder="请输入姓名" allowClear />
      </Form.Item>

      <Form.Item
        name="position_salary"
        label="岗位工资"
        rules={[
          { type: 'number', message: '请输入有效的数字' },
        ]}
      >
        <InputNumber
          min={0}
          step={0.01}
          precision={2}
          style={{ width: '100%' }}
          placeholder="请输入岗位工资"
        />
      </Form.Item>

      <Form.Item name="remark" label="备注">
        <Input.TextArea rows={3} placeholder="请输入备注" />
      </Form.Item>
    </Form>
  )
}
