import type { EmployeeChangePasswordValues } from './EmployeeChangePasswordForm'
import { App, Button, Card, Typography } from 'antd'
import { useState } from 'react'

import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/useAuth'
import { translateErrorMessage } from '@/utils/errorHandler'
import EmployeeChangePasswordForm from './EmployeeChangePasswordForm'

const { Paragraph, Title } = Typography

export default function EmployeeMobileChangePasswordPage() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { changePassword, signOut, user, employeeProfile } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChangePassword = async ({
    currentPassword,
    password,
  }: EmployeeChangePasswordValues) => {
    setIsSubmitting(true)

    try {
      await changePassword(currentPassword, password)
      await signOut()
      navigate('/login', {
        replace: true,
        state: { message: '密码修改成功，请使用新密码重新登录' },
      })
    }
    catch (error) {
      message.error(
        error instanceof Error
          ? translateErrorMessage(error.message)
          : '密码修改失败',
      )
    }
    finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto px-4 pt-4 pb-44">
      <div className="mx-auto flex max-w-2xl flex-col gap-3">
        <section className="rounded-2xl border border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-[11px] font-semibold tracking-[0.2em] text-slate-400 uppercase dark:text-slate-500">
            Account Security
          </div>
          <Title level={4} className="mt-2! mb-1.5! text-slate-900! dark:text-slate-100!">
            修改我的密码
          </Title>
          <Paragraph className="mb-0! text-sm text-slate-500 dark:text-slate-400">
            密码修改成功后将自动退出，并要求使用新密码重新登录。
          </Paragraph>
        </section>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
          <EmployeeChangePasswordForm
            employeeName={employeeProfile?.name || user?.email || null}
            loading={isSubmitting}
            onFinish={handleChangePassword}
          />
        </Card>
      </div>

      <div
        className="fixed inset-x-0 z-40 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 74px)' }}
      >
        <div className="mx-auto grid max-w-2xl grid-cols-2 gap-3">
          <Button className="h-11 rounded-xl" onClick={() => navigate(-1)}>
            返回上一页
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            form="employee-change-password-form"
            className="h-11 rounded-xl"
            loading={isSubmitting}
          >
            保存新密码
          </Button>
        </div>
      </div>
    </div>
  )
}
