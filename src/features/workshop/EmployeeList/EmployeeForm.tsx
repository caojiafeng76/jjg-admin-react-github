import { Alert, Divider, Form, FormInstance, Input, Select, Switch } from 'antd'
import { useEffect } from 'react'
import { ROLE_OPTIONS } from '@/config/access'
import type { Employee } from '@/services/apiEmployees'
import { DEFAULT_EMPLOYEE_AUTH_PASSWORD } from './constants'

export interface EmployeeFormValues extends Employee {
  createAuthAccount?: boolean
  authEmail?: string
}

interface Props {
  onFinish: (values: EmployeeFormValues) => void
  setFormRef: (form: FormInstance<EmployeeFormValues>) => void
  isCreating: boolean
  isEdit: boolean
  initialValues?: Employee
}

export default function EmployeeForm({
  onFinish,
  setFormRef,
  isCreating,
  isEdit,
  initialValues,
}: Props) {
  const [form] = Form.useForm<EmployeeFormValues>()
  const createAuthAccount = Form.useWatch('createAuthAccount', form)

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        role: 'employee',
        is_active: true,
        ...initialValues,
      })
    } else {
      form.setFieldsValue({
        name: '',
        role: 'employee',
        is_active: true,
        createAuthAccount: false,
      })
    }
  }, [form, initialValues])

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      disabled={isCreating}
      initialValues={{
        role: 'employee',
        is_active: true,
        createAuthAccount: false,
      }}
    >
      <Alert
        type="info"
        showIcon
        className="mb-4"
        message={
          isEdit
            ? '这里只维护员工基础资料；现有员工的账号开通、解绑、重绑和重置密码请使用工具栏按钮。'
            : `新增员工时可选择同时创建登录账号；默认密码为 ${DEFAULT_EMPLOYEE_AUTH_PASSWORD}，后续账号操作仍可通过工具栏按钮完成。`
        }
      />

      <Form.Item
        name="name"
        label="姓名"
        rules={[
          { required: true, message: '请输入姓名' },
          { max: 100, message: '姓名不能超过100个字符' },
        ]}
      >
        <Input placeholder="请输入姓名" disabled={isCreating} />
      </Form.Item>

      <Form.Item
        name="role"
        label="角色"
        rules={[{ required: true, message: '请选择角色' }]}
      >
        <Select
          disabled={isCreating}
          options={ROLE_OPTIONS}
        />
      </Form.Item>

      <Form.Item name="is_active" label="启用状态" valuePropName="checked">
        <Switch
          checkedChildren="启用"
          unCheckedChildren="停用"
          disabled={isCreating}
        />
      </Form.Item>

      {isEdit ? null : (
        <>
          <Divider className="my-4">登录账号</Divider>

          <Form.Item
            name="createAuthAccount"
            label="同时创建登录账号"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="创建账号"
              unCheckedChildren="仅建员工"
              disabled={isCreating}
            />
          </Form.Item>

          {createAuthAccount ? (
            <>
              <Form.Item
                name="authEmail"
                label="登录邮箱"
                rules={[
                  { required: true, message: '请输入登录邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' },
                ]}
              >
                <Input placeholder="请输入员工登录邮箱" autoComplete="off" />
              </Form.Item>

              <div className="rounded-lg border border-dashed border-sky-200 bg-sky-50 px-3 py-2 text-xs leading-6 text-sky-700">
                系统将自动使用默认密码 {DEFAULT_EMPLOYEE_AUTH_PASSWORD}{' '}
                创建账号，员工登录后可自行修改密码。
              </div>
            </>
          ) : null}
        </>
      )}

      {isEdit ? null : (
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-xs leading-6 text-gray-500">
          新建员工时默认角色为“员工”、状态为“启用”。如果本次创建账号，默认密码为{' '}
          {DEFAULT_EMPLOYEE_AUTH_PASSWORD}
          。如果本次不创建账号，后续仍可使用工具栏中的“为现有员工开通账号”补做绑定。
        </div>
      )}
    </Form>
  )
}
