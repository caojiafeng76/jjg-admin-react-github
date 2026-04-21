import { useState } from 'react'
import { Form, Input, Modal } from 'antd'
import { useAllPermissions } from './useRolePermissions'
import { useCreateRole } from './useRoles'

interface Props {
  open: boolean
  onClose: () => void
  onCreated?: (key: string) => void
}

interface FormValues {
  key: string
  label: string
  description?: string
}

export default function RoleCreateModal({ open, onClose, onCreated }: Props) {
  const [form] = Form.useForm<FormValues>()
  const { data: allPermissions = [] } = useAllPermissions()
  const { mutate: createRole, isPending, contextHolder } = useCreateRole()
  const [pickedPermissionIds] = useState<string[]>([])

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        createRole(
          {
            key: values.key.trim(),
            label: values.label.trim(),
            description: values.description?.trim() || null,
            permissionIds: pickedPermissionIds,
          },
          {
            onSuccess: () => {
              form.resetFields()
              onCreated?.(values.key.trim())
              onClose()
            },
          },
        )
      })
      .catch(() => {})
  }

  return (
    <>
      {contextHolder}
      <Modal
        title="新建自定义角色"
        open={open}
        onCancel={() => {
          form.resetFields()
          onClose()
        }}
        onOk={handleOk}
        okText="创建"
        cancelText="取消"
        confirmLoading={isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="key"
            label="角色 Key"
            rules={[
              { required: true, message: '请输入角色 Key' },
              {
                pattern: /^[a-z][a-z0-9_]*$/,
                message: '只能使用小写字母、数字、下划线，且以字母开头',
              },
              { max: 64, message: '不超过 64 字符' },
            ]}
            extra="将作为数据库角色标识，创建后不可修改。例如：quality_inspector"
          >
            <Input placeholder="例如：quality_inspector" autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="label"
            label="角色名称"
            rules={[
              { required: true, message: '请输入角色名称' },
              { max: 32, message: '不超过 32 字符' },
            ]}
          >
            <Input placeholder="例如：质检员" autoComplete="off" />
          </Form.Item>
          <Form.Item name="description" label="描述（可选）">
            <Input.TextArea rows={2} maxLength={200} showCount />
          </Form.Item>
          <div className="text-xs text-gray-400">
            创建成功后，可在角色权限管理界面为该角色勾选具体权限并保存。
            当前权限注册表共 {allPermissions.length} 项。
          </div>
        </Form>
      </Modal>
    </>
  )
}
