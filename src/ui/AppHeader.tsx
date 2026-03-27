import {
  Bars3BottomLeftIcon,
  Bars3BottomRightIcon,
} from '@heroicons/react/16/solid'
import { KeyIcon } from '@heroicons/react/24/outline'
import { App, Button, Form, Input, Modal } from 'antd'
import { Header } from 'antd/es/layout/layout'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import DarkModeButton from '@ui/DarkModeButton'
import { getRoleLabel } from '@/config/access'
import { useAuth } from '@/contexts/AuthContext'
import { updateAdminManagementPassword } from '@/services/apiAdminManagementPassword'

// 路由到页面名称的映射
const routeToLabelMap: Record<string, string> = {
  dashboard: '首页',
  'syney-po-list': '订单列表',
  'syney-store-report-list': '入库单列表',
  'syney-spec-list': '踏板规格列表',
  'syney-safe-part-setting': '安全件设置',
  'syney-setting': '编号设置',
  'workshop-order-list': '订单管理',
  'workshop-process-list': '工序管理',
  'workshop-defect-reason-list': '不良原因管理',
  'employee-list': '员工管理',
  'standard-time-list': '成本核算',
  'job-base-setting': '岗位基础数值设定',
  'production-order': '生产工单',
  'production-daily-report': '生产日报表',
}


export default function AppHeader({
  colorBgContainer,
  collapsed,
  onToggleCollapse,
}: {
  colorBgContainer: string
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  const { message } = App.useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, role, employeeProfile, signOut } = useAuth()
  const [isManagementPasswordModalOpen, setIsManagementPasswordModalOpen] =
    useState(false)
  const [isUpdatingManagementPassword, setIsUpdatingManagementPassword] =
    useState(false)
  const [managementPasswordForm] = Form.useForm<{
    currentPassword: string
    nextPassword: string
    confirmPassword: string
  }>()
  const currentPath = location.pathname.slice(1) || 'dashboard'
  const pageName = routeToLabelMap[currentPath] || ''
  const displayName = employeeProfile?.name || user?.email || '未登录用户'
  const roleLabel = getRoleLabel(role)

  const handleChangeManagementPassword = async (values: {
    currentPassword: string
    nextPassword: string
    confirmPassword: string
  }) => {
    setIsUpdatingManagementPassword(true)

    try {
      await updateAdminManagementPassword({
        currentPassword: values.currentPassword,
        nextPassword: values.nextPassword,
      })
      managementPasswordForm.resetFields()
      setIsManagementPasswordModalOpen(false)
      message.success('管理密码修改成功')
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      } else {
        message.error('管理密码修改失败')
      }
    } finally {
      setIsUpdatingManagementPassword(false)
    }
  }

  return (
    <>
      <Header
        className="flex items-center"
        style={{ padding: 0, background: colorBgContainer }}
      >
        <Button
          type="text"
          icon={
            collapsed ? (
              <Bars3BottomRightIcon className="size-4" />
            ) : (
              <Bars3BottomLeftIcon className="size-4" />
            )
          }
          onClick={onToggleCollapse}
          style={{
            fontSize: 16,
            width: 64,
            height: 64,
          }}
        />
        {pageName && (
          <span className="ml-2 text-base font-semibold text-neutral-900 dark:text-neutral-50">
            {pageName}
          </span>
        )}

        <div className="mr-12 flex h-full flex-1 items-center justify-end gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            欢迎您：{displayName}
            {roleLabel ? `（${roleLabel}）` : ''}
          </span>
          {role === 'admin' ? (
            <Button
              type="link"
              icon={<KeyIcon className="size-4" />}
              onClick={() => setIsManagementPasswordModalOpen(true)}
            >
              修改管理密码
            </Button>
          ) : null}
          <DarkModeButton />
          <Button
            type="link"
            onClick={async () => {
              try {
                await signOut()
                navigate('/login', { replace: true })
              } catch {
                // 可以在这里接入全局 message 提示
              }
            }}
          >
            退出登录
          </Button>
        </div>
      </Header>

      <Modal
        title="修改我的管理密码"
        open={isManagementPasswordModalOpen}
        destroyOnClose
        confirmLoading={isUpdatingManagementPassword}
        onOk={() => managementPasswordForm.submit()}
        onCancel={() => {
          setIsManagementPasswordModalOpen(false)
          managementPasswordForm.resetFields()
        }}
      >
        <Form
          form={managementPasswordForm}
          layout="vertical"
          onFinish={handleChangeManagementPassword}
        >
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
    </>
  )
}
