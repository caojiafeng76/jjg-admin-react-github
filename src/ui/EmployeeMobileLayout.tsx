import { App, Layout, Button, Modal, theme } from 'antd'
import { useState } from 'react'
import {
  ArrowRightStartOnRectangleIcon,
  ClipboardDocumentListIcon,
  DocumentChartBarIcon,
  KeyIcon,
} from '@heroicons/react/24/outline'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '@/contexts/AuthContext'
import EmployeeChangePasswordForm, {
  type EmployeeChangePasswordValues,
} from './EmployeeChangePasswordForm'
import { translateErrorMessage } from '@/utils/errorHandler'

const { Content } = Layout

const navItems = [
  {
    key: '/production-order',
    label: '我的工单',
    icon: ClipboardDocumentListIcon,
  },
  {
    key: '/production-daily-report',
    label: '我的日报',
    icon: DocumentChartBarIcon,
  },
]

export default function EmployeeMobileLayout() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut, changePassword, user, employeeProfile } = useAuth()
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false)
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  const handleChangePassword = async ({
    currentPassword,
    password,
  }: EmployeeChangePasswordValues) => {
    setIsSubmittingPassword(true)

    try {
      await changePassword(currentPassword, password)
      setIsPasswordModalOpen(false)
      await signOut()
      navigate('/login', {
        replace: true,
        state: { message: '密码修改成功，请使用新密码重新登录' },
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? translateErrorMessage(error.message) : '密码修改失败'
      message.error(errorMessage)
    } finally {
      setIsSubmittingPassword(false)
    }
  }

  return (
    <Layout className="min-h-screen bg-[radial-gradient(circle_at_top,#f5f7ff_0%,#eef2ff_35%,#e8edf5_100%)]">
      <header className="sticky top-0 z-20 border-b border-white/50 bg-white/85 px-4 pt-[calc(env(safe-area-inset-top)+14px)] pb-3 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-medium tracking-[0.24em] text-slate-400 uppercase">
              Employee Workspace
            </div>
            <div className="mt-1 text-xl font-black tracking-tight text-slate-900">
              {employeeProfile?.name || user?.email || '员工端'}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              手机端工单录入与日报查询
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Button
              type="text"
              className="rounded-full border border-slate-200/80 bg-white/90 px-3"
              icon={<KeyIcon className="size-4" />}
              onClick={() => setIsPasswordModalOpen(true)}
            >
              修改密码
            </Button>

            <Button
              type="text"
              className="rounded-full border border-slate-200/80 bg-white/90 px-3"
              icon={<ArrowRightStartOnRectangleIcon className="size-4" />}
              onClick={async () => {
                await signOut()
                navigate('/login', { replace: true })
              }}
            >
              退出
            </Button>
          </div>
        </div>
      </header>

      <Content className="px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+84px)]">
        <div
          className="min-h-[calc(100vh-168px)] rounded-4xl border border-white/60 shadow-[0_20px_70px_rgba(15,23,42,0.08)]"
          style={{ background: colorBgContainer }}
        >
          <Outlet />
        </div>
      </Content>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/60 bg-white/92 px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+10px)] backdrop-blur-xl">
        <div className="grid grid-cols-2 gap-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.key
            const Icon = item.icon

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate(item.key)}
                className={
                  isActive
                    ? 'flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(15,23,42,0.25)] transition'
                    : 'flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-600 transition'
                }
              >
                <Icon className="size-4" />
                {item.label}
              </button>
            )
          })}
        </div>
      </nav>

      <Modal
        title="修改我的密码"
        open={isPasswordModalOpen}
        onCancel={() => setIsPasswordModalOpen(false)}
        footer={null}
        destroyOnClose
        width="calc(100vw - 24px)"
        style={{ top: 16, maxWidth: 480 }}
      >
        <EmployeeChangePasswordForm
          employeeName={employeeProfile?.name || user?.email || null}
          loading={isSubmittingPassword}
          onFinish={handleChangePassword}
        />

        <div className="mt-4 flex gap-3">
          <Button
            className="flex-1 rounded-2xl"
            onClick={() => setIsPasswordModalOpen(false)}
          >
            取消
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            form="employee-change-password-form"
            className="flex-1 rounded-2xl"
            loading={isSubmittingPassword}
          >
            保存新密码
          </Button>
        </div>
      </Modal>
    </Layout>
  )
}
