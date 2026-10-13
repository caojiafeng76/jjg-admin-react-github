import { Form, Input, Modal } from 'antd'
import type { FormInstance } from 'antd'
import type { ChangeManagementPasswordFormValues } from './productionOrderPageUtils'

export interface ProductionOrderManagementPasswordModalProps {
  confirmLoading: boolean
  form: FormInstance<ChangeManagementPasswordFormValues>
  onCancel: () => void
  onSubmit: (values: ChangeManagementPasswordFormValues) => void | Promise<void>
  open: boolean
}

export default function ProductionOrderManagementPasswordModal({
  confirmLoading,
  form,
  onCancel,
  onSubmit,
  open,
}: ProductionOrderManagementPasswordModalProps) {
  return (
    <Modal
      title="修改我的管理密码"
      open={open}
      destroyOnClose
      confirmLoading={confirmLoading}
      onOk={() => form.submit()}
      onCancel={onCancel}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          name="currentPassword"
          label="当前管理密码"
          rules={[{ required: true, message: '请输入当前管理密码' }]}
        >
          <Input.Password autoComplete="current-password" />
        </Form.Item>

        <Form.Item
          name="nextPassword"
          label="新管理密码"
          rules={[
            { required: true, message: '请输入新管理密码' },
            { min: 6, message: '新管理密码至少需要 6 位' },
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="确认新管理密码"
          dependencies={['nextPassword']}
          rules={[
            { required: true, message: '请再次输入新管理密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('nextPassword') === value) {
                  return Promise.resolve()
                }

                return Promise.reject(new Error('两次输入的新管理密码不一致'))
              },
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
