import type {
  ChangeManagementPasswordFormValues,
  UnlockManagementFormValues,
} from './productionOrderPageUtils'
import { App, Form } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import {
  updateAdminManagementPassword,
  verifyAdminManagementPassword,
} from '@/services/apiAdminManagementPassword'

export function useProductionOrderManagementAccess({
  isAdminManagementView,
  isEmployeeView,
  resetFormState,
}: {
  isAdminManagementView: boolean
  isEmployeeView: boolean
  resetFormState: () => void
}) {
  const { message } = App.useApp()
  const [isManagementUnlocked, setIsManagementUnlocked] = useState(
    !isAdminManagementView,
  )
  const [isUnlockingManagement, setIsUnlockingManagement] = useState(false)
  const [isManagementPasswordModalOpen, setIsManagementPasswordModalOpen]
    = useState(false)
  const [isUpdatingManagementPassword, setIsUpdatingManagementPassword]
    = useState(false)
  const [unlockForm] = Form.useForm<UnlockManagementFormValues>()
  const [changePasswordForm]
    = Form.useForm<ChangeManagementPasswordFormValues>()
  const isManagementLocked = isAdminManagementView && !isManagementUnlocked

  const handleLockManagement = useCallback(() => {
    resetFormState()
    unlockForm.resetFields()
    setIsManagementUnlocked(false)
    setIsManagementPasswordModalOpen(false)
    message.success('生产工单管理已锁定')
  }, [message, resetFormState, unlockForm])

  const handleUnlockManagement = useCallback(
    async (values: UnlockManagementFormValues) => {
      setIsUnlockingManagement(true)

      try {
        await verifyAdminManagementPassword(values.password)
        setIsManagementUnlocked(true)
        unlockForm.resetFields()
        message.success('管理权限已解锁')
      }
      catch (error) {
        if (error instanceof Error) {
          message.error(error.message)
        }
        else {
          message.error('管理密码验证失败')
        }
      }
      finally {
        setIsUnlockingManagement(false)
      }
    },
    [message, unlockForm],
  )

  const handleChangeManagementPassword = useCallback(
    async (values: ChangeManagementPasswordFormValues) => {
      setIsUpdatingManagementPassword(true)

      try {
        await updateAdminManagementPassword({
          currentPassword: values.currentPassword,
          nextPassword: values.nextPassword,
        })
        changePasswordForm.resetFields()
        setIsManagementPasswordModalOpen(false)
        message.success('管理密码修改成功')
      }
      catch (error) {
        if (error instanceof Error) {
          message.error(error.message)
        }
        else {
          message.error('管理密码修改失败')
        }
      }
      finally {
        setIsUpdatingManagementPassword(false)
      }
    },
    [changePasswordForm, message],
  )
  const openPasswordModal = useCallback(() => {
    setIsManagementPasswordModalOpen(true)
  }, [])

  const closePasswordModal = useCallback(() => {
    setIsManagementPasswordModalOpen(false)
    changePasswordForm.resetFields()
  }, [changePasswordForm])
  useEffect(() => {
    if (isEmployeeView) {
      setIsManagementUnlocked(true)
      return
    }

    setIsManagementUnlocked(false)
    setIsManagementPasswordModalOpen(false)
    unlockForm.resetFields()
    changePasswordForm.resetFields()
    resetFormState()
  }, [changePasswordForm, isEmployeeView, resetFormState, unlockForm])
  return {
    changePasswordForm,
    closePasswordModal,
    handleChangeManagementPassword,
    handleLockManagement,
    handleUnlockManagement,
    isManagementLocked,
    isManagementPasswordModalOpen,
    isUnlockingManagement,
    isUpdatingManagementPassword,
    openPasswordModal,
    unlockForm,
  }
}
