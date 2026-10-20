import type { FormInstance } from 'antd'
import type { UnlockManagementFormValues } from './productionOrderPageUtils'
import {
  KeyIcon,
  LockClosedIcon,
  LockOpenIcon,
} from '@heroicons/react/24/outline'
import { Button, Card, Form, Input, Space, Typography } from 'antd'

const { Paragraph, Text, Title } = Typography

export interface ProductionOrderManagementLockProps {
  isUnlocking: boolean
  onOpenPasswordModal: () => void
  onUnlock: (values: UnlockManagementFormValues) => void | Promise<void>
  unlockForm: FormInstance<UnlockManagementFormValues>
}

export default function ProductionOrderManagementLock({
  isUnlocking,
  onOpenPasswordModal,
  onUnlock,
  unlockForm,
}: ProductionOrderManagementLockProps) {
  return (
    <div className="flex h-full items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md shadow-sm">
        <Space orientation="vertical" size={16} className="w-full">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <LockClosedIcon className="size-5" />
            </div>
            <div>
              <Title level={4} style={{ marginBottom: 0 }}>
                生产工单管理已锁定
              </Title>
              <Text type="secondary">管理员进入页面后需先输入管理密码</Text>
            </div>
          </div>

          <Paragraph style={{ marginBottom: 0 }}>
            首次默认管理密码为 123456。密码正确后才会加载工单管理界面。
          </Paragraph>

          <Form form={unlockForm} layout="vertical" onFinish={onUnlock}>
            <Form.Item
              name="password"
              label="管理密码"
              rules={[{ required: true, message: '请输入管理密码' }]}
            >
              <Input.Password
                autoFocus
                placeholder="请输入管理密码"
                autoComplete="current-password"
              />
            </Form.Item>

            <div className="flex gap-3">
              <Button
                type="primary"
                htmlType="submit"
                loading={isUnlocking}
                icon={<LockOpenIcon className="size-4" />}
                className="flex-1"
              >
                解锁管理
              </Button>
              <Button
                icon={<KeyIcon className="size-4" />}
                className="flex-1"
                onClick={onOpenPasswordModal}
              >
                修改我的密码
              </Button>
            </div>
          </Form>
        </Space>
      </Card>
    </div>
  )
}
