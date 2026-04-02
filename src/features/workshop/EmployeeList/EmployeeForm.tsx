import {
  Alert,
  Divider,
  Form,
  FormInstance,
  Input,
  InputNumber,
  Select,
  Switch,
} from 'antd'
import { useEffect, useMemo } from 'react'
import { ROLE_OPTIONS } from '@/config/access'
import type { Employee } from '@/services/apiEmployees'
import { useEmployeeJobBaseSettingOptions } from './useEmployees'
import { DEFAULT_EMPLOYEE_AUTH_PASSWORD } from './constants'

const DEFAULT_FORM_VALUES: EmployeeFormValues = {
  name: '',
  role: 'employee',
  is_active: true,
  job_name: undefined,
  hourly_wage: 0,
  coefficient: 1,
  createAuthAccount: false,
}

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
  const { data: jobOptions = [], isLoading: isJobOptionsLoading } =
    useEmployeeJobBaseSettingOptions()
  const jobSelectOptions = useMemo(
    () =>
      jobOptions.map((option) => ({
        label: option.job_name,
        value: option.job_name,
      })),
    [jobOptions],
  )
  const jobRateMap = useMemo(
    () =>
      new Map(
        jobOptions.map((option) => [
          option.job_name,
          Number(option.hourly_fee || 0),
        ]),
      ),
    [jobOptions],
  )

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...DEFAULT_FORM_VALUES,
        ...initialValues,
        job_name: initialValues.job_name || undefined,
        hourly_wage: Number(initialValues.hourly_wage ?? 0),
        coefficient: Number(initialValues.coefficient ?? 1),
      })
    } else {
      form.setFieldsValue(DEFAULT_FORM_VALUES)
    }
  }, [form, initialValues])

  const handleJobChange = (value: string | undefined) => {
    if (!value) {
      form.setFieldValue('hourly_wage', 0)
      return
    }

    const matchedRate = jobRateMap.get(value)
    form.setFieldValue('hourly_wage', matchedRate ?? 0)
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      disabled={isCreating}
      initialValues={DEFAULT_FORM_VALUES}
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
        <Select disabled={isCreating} options={ROLE_OPTIONS} />
      </Form.Item>

      <Form.Item
        name="job_name"
        label="工种"
        rules={[{ required: true, message: '请选择工种' }]}
        extra="选定工种后，岗位时薪会自动绑定岗位基础表中的工时费；岗位基础表变动后会自动同步。"
      >
        <Select
          showSearch
          optionFilterProp="label"
          placeholder="请选择工种"
          loading={isJobOptionsLoading}
          options={jobSelectOptions}
          onChange={handleJobChange}
          disabled={isCreating}
        />
      </Form.Item>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Form.Item name="hourly_wage" label="岗位时薪">
          <InputNumber
            min={0}
            step={0.01}
            precision={2}
            style={{ width: '100%' }}
            placeholder="选择工种后自动带出"
            disabled
          />
        </Form.Item>

        <Form.Item
          name="coefficient"
          label="系数"
          rules={[{ required: true, message: '请输入系数' }]}
        >
          <InputNumber
            min={0}
            step={0.01}
            precision={2}
            style={{ width: '100%' }}
            placeholder="请输入系数"
            disabled={isCreating}
          />
        </Form.Item>
      </div>

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
