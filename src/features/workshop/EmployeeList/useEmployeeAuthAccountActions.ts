import { useCallback, useRef, useState } from 'react'
import type { Dispatch, Key, SetStateAction } from 'react'
import { App, type FormInstance } from 'antd'

import type { Employee } from '@/services/apiEmployees'
import {
  useCreateEmployeeAuthAccount,
  useEmployeeAuthEmail,
  useRebindEmployeeAuthAccount,
  useResetEmployeeAuthPassword,
  useUnbindEmployeeAuthAccount,
} from './useEmployees'
import type { EmployeeAuthAccountValues } from './EmployeeAuthAccountForm'
import type { EmployeeRebindAccountValues } from './EmployeeRebindAccountForm'
import type { EmployeeResetPasswordValues } from './EmployeeResetPasswordForm'
import { DEFAULT_EMPLOYEE_AUTH_PASSWORD } from './constants'

interface UseEmployeeAuthAccountActionsOptions {
  data: { items: Employee[] } | undefined
  selectedRowKeys: Key[]
  setSelectedRowKeys: Dispatch<SetStateAction<Key[]>>
}

export function useEmployeeAuthAccountActions({
  data,
  selectedRowKeys,
  setSelectedRowKeys,
}: UseEmployeeAuthAccountActionsOptions) {
  const { message, modal } = App.useApp()

  const authFormRef = useRef<FormInstance<EmployeeAuthAccountValues> | null>(
    null,
  )
  const resetPasswordFormRef =
    useRef<FormInstance<EmployeeResetPasswordValues> | null>(null)
  const rebindFormRef =
    useRef<FormInstance<EmployeeRebindAccountValues> | null>(null)
  const setAuthFormRef = useCallback(
    (form: FormInstance<EmployeeAuthAccountValues>) => {
      authFormRef.current = form
    },
    [],
  )
  const setResetPasswordFormRef = useCallback(
    (form: FormInstance<EmployeeResetPasswordValues>) => {
      resetPasswordFormRef.current = form
    },
    [],
  )
  const setRebindFormRef = useCallback(
    (form: FormInstance<EmployeeRebindAccountValues>) => {
      rebindFormRef.current = form
    },
    [],
  )
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authTargetEmployee, setAuthTargetEmployee] = useState<Employee | null>(
    null,
  )
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] =
    useState(false)
  const [isRebindModalOpen, setIsRebindModalOpen] = useState(false)

  const createEmployeeAuthMutation = useCreateEmployeeAuthAccount()
  const resetEmployeeAuthPasswordMutation = useResetEmployeeAuthPassword()
  const unbindEmployeeAuthAccountMutation = useUnbindEmployeeAuthAccount()
  const rebindEmployeeAuthAccountMutation = useRebindEmployeeAuthAccount()
  const { data: rebindAuthEmail, isFetching: isFetchingRebindAuthEmail } =
    useEmployeeAuthEmail(authTargetEmployee?.id, isRebindModalOpen)

  const handleOpenCreateAuthModal = useCallback(() => {
    if (selectedRowKeys.length !== 1) {
      message.warning('请选择一条现有员工数据进行账号开通')
      return
    }

    const record = data?.items.find((item) => item.id === selectedRowKeys[0])

    if (!record) {
      return
    }

    if (record.auth_user_id) {
      message.warning('该员工已绑定账号，如需更换请使用重新绑定或先解绑')
      return
    }

    setAuthTargetEmployee(record)
    setIsAuthModalOpen(true)
  }, [data?.items, message, selectedRowKeys])

  const getSingleSelectedEmployee = useCallback(() => {
    if (selectedRowKeys.length !== 1) {
      message.warning('请选择一条员工数据进行操作')
      return null
    }

    const record = data?.items.find((item) => item.id === selectedRowKeys[0])

    if (!record) {
      message.warning('未找到所选员工')
      return null
    }

    return record
  }, [data?.items, message, selectedRowKeys])

  const handleOpenResetPasswordModal = useCallback(() => {
    const record = getSingleSelectedEmployee()

    if (!record) return

    if (!record.auth_user_id) {
      message.warning('该员工尚未绑定账号，无法重置密码')
      return
    }

    setAuthTargetEmployee(record)
    setIsResetPasswordModalOpen(true)
  }, [getSingleSelectedEmployee, message])

  const handleUnbindAuthAccount = useCallback(() => {
    const record = getSingleSelectedEmployee()

    if (!record) return

    if (!record.auth_user_id) {
      message.warning('该员工当前没有绑定账号')
      return
    }

    modal.confirm({
      title: '解绑员工账号',
      okText: '确认解绑',
      cancelText: '取消',
      okButtonProps: { danger: true },
      content: `确定解绑员工“${record.name}”当前账号吗？解绑后该员工将无法再通过当前账号访问系统。`,
      onOk: async () => {
        try {
          const result = await unbindEmployeeAuthAccountMutation.mutateAsync(
            record.id as string,
          )
          message.success(`已解绑员工 ${result.employeeName} 的登录账号`)
          setSelectedRowKeys([])
        } catch (error) {
          if (error instanceof Error) {
            message.error(error.message)
          } else {
            message.error('解绑员工账号失败')
          }

          throw error
        }
      },
    })
  }, [
    getSingleSelectedEmployee,
    message,
    modal,
    setSelectedRowKeys,
    unbindEmployeeAuthAccountMutation,
  ])

  const handleOpenRebindModal = useCallback(() => {
    const record = getSingleSelectedEmployee()

    if (!record) return

    setAuthTargetEmployee(record)
    setIsRebindModalOpen(true)
  }, [getSingleSelectedEmployee])

  const handleCreateAuthAccount = useCallback(
    async (values: EmployeeAuthAccountValues) => {
      if (!authTargetEmployee?.id) {
        message.error('未找到要绑定账号的员工')
        return
      }

      try {
        const result = await createEmployeeAuthMutation.mutateAsync({
          employeeId: authTargetEmployee.id,
          email: values.email,
          password: DEFAULT_EMPLOYEE_AUTH_PASSWORD,
        })

        message.success(
          `已为现有员工 ${result.employeeName} 开通账号并绑定到 ${result.email}，默认密码为 ${DEFAULT_EMPLOYEE_AUTH_PASSWORD}`,
        )
        setSelectedRowKeys([])
        setIsAuthModalOpen(false)
        setAuthTargetEmployee(null)
        authFormRef.current?.resetFields()
      } catch (error) {
        if (error instanceof Error) {
          message.error(error.message)
        } else {
          message.error('创建员工登录账号失败')
        }
      }
    },
    [
      authTargetEmployee,
      createEmployeeAuthMutation,
      message,
      setSelectedRowKeys,
    ],
  )

  const handleResetPassword = useCallback(
    async (values: EmployeeResetPasswordValues) => {
      if (!authTargetEmployee?.id) {
        message.error('未找到目标员工')
        return
      }

      try {
        const result = await resetEmployeeAuthPasswordMutation.mutateAsync({
          employeeId: authTargetEmployee.id,
          password: values.password,
        })

        message.success(`已重置员工 ${result.employeeName} 的登录密码`)
        setSelectedRowKeys([])
        setIsResetPasswordModalOpen(false)
        resetPasswordFormRef.current?.resetFields()
      } catch (error) {
        if (error instanceof Error) {
          message.error(error.message)
        } else {
          message.error('重置员工登录密码失败')
        }
      }
    },
    [
      authTargetEmployee,
      message,
      resetEmployeeAuthPasswordMutation,
      setSelectedRowKeys,
    ],
  )

  const handleRebindAccount = useCallback(
    async (values: EmployeeRebindAccountValues) => {
      if (!authTargetEmployee?.id) {
        message.error('未找到目标员工')
        return
      }

      try {
        const result = await rebindEmployeeAuthAccountMutation.mutateAsync({
          employeeId: authTargetEmployee.id,
          email: values.email,
        })

        message.success(
          `已将 ${result.employeeName} 重新绑定到账号 ${result.email}`,
        )
        setSelectedRowKeys([])
        setIsRebindModalOpen(false)
        rebindFormRef.current?.resetFields()
      } catch (error) {
        if (error instanceof Error) {
          message.error(error.message)
        } else {
          message.error('重新绑定员工账号失败')
        }
      }
    },
    [
      authTargetEmployee,
      message,
      rebindEmployeeAuthAccountMutation,
      setSelectedRowKeys,
    ],
  )

  const handleCancelAuthModal = useCallback(() => {
    setIsAuthModalOpen(false)
    setAuthTargetEmployee(null)
    authFormRef.current?.resetFields()
  }, [])

  const handleCancelResetPasswordModal = useCallback(() => {
    setIsResetPasswordModalOpen(false)
    resetPasswordFormRef.current?.resetFields()
  }, [])

  const handleCancelRebindModal = useCallback(() => {
    setIsRebindModalOpen(false)
    rebindFormRef.current?.resetFields()
  }, [])

  return {
    authFormRef,
    resetPasswordFormRef,
    rebindFormRef,
    setAuthFormRef,
    setResetPasswordFormRef,
    setRebindFormRef,
    isAuthModalOpen,
    authTargetEmployee,
    isResetPasswordModalOpen,
    isRebindModalOpen,
    createEmployeeAuthMutation,
    resetEmployeeAuthPasswordMutation,
    rebindEmployeeAuthAccountMutation,
    rebindAuthEmail,
    isFetchingRebindAuthEmail,
    handleOpenCreateAuthModal,
    handleOpenResetPasswordModal,
    handleUnbindAuthAccount,
    handleOpenRebindModal,
    handleCreateAuthAccount,
    handleResetPassword,
    handleRebindAccount,
    handleCancelAuthModal,
    handleCancelResetPasswordModal,
    handleCancelRebindModal,
  }
}

export type EmployeeAuthAccountActions = ReturnType<
  typeof useEmployeeAuthAccountActions
>
