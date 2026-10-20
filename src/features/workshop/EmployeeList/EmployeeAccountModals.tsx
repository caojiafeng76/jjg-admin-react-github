import type { EmployeeAuthAccountActions } from './useEmployeeAuthAccountActions'

import { Modal } from 'antd'
import EmployeeAuthAccountForm from './EmployeeAuthAccountForm'
import EmployeeRebindAccountForm from './EmployeeRebindAccountForm'
import EmployeeResetPasswordForm from './EmployeeResetPasswordForm'

export interface EmployeeAccountModalsProps {
  actions: EmployeeAuthAccountActions
}

export default function EmployeeAccountModals({
  actions,
}: EmployeeAccountModalsProps) {
  const {
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
    handleCreateAuthAccount,
    handleResetPassword,
    handleRebindAccount,
    handleCancelAuthModal,
    handleCancelResetPasswordModal,
    handleCancelRebindModal,
  } = actions

  return (
    <>
      <Modal
        title="为现有员工开通账号"
        open={isAuthModalOpen}
        width={560}
        destroyOnClose
        confirmLoading={createEmployeeAuthMutation.isPending}
        onOk={() => authFormRef.current?.submit()}
        onCancel={handleCancelAuthModal}
      >
        {authTargetEmployee
          ? (
              <EmployeeAuthAccountForm
                employee={authTargetEmployee}
                setFormRef={setAuthFormRef}
                onFinish={handleCreateAuthAccount}
                isSubmitting={createEmployeeAuthMutation.isPending}
              />
            )
          : null}
      </Modal>

      <Modal
        title="重置员工登录密码"
        open={isResetPasswordModalOpen}
        width={520}
        destroyOnClose
        confirmLoading={resetEmployeeAuthPasswordMutation.isPending}
        onOk={() => resetPasswordFormRef.current?.submit()}
        onCancel={handleCancelResetPasswordModal}
      >
        {authTargetEmployee
          ? (
              <EmployeeResetPasswordForm
                employee={authTargetEmployee}
                setFormRef={setResetPasswordFormRef}
                onFinish={handleResetPassword}
                isSubmitting={resetEmployeeAuthPasswordMutation.isPending}
              />
            )
          : null}
      </Modal>

      <Modal
        title="重新绑定员工账号"
        open={isRebindModalOpen}
        width={520}
        destroyOnClose
        confirmLoading={rebindEmployeeAuthAccountMutation.isPending}
        onOk={() => rebindFormRef.current?.submit()}
        onCancel={handleCancelRebindModal}
      >
        {authTargetEmployee
          ? (
              <EmployeeRebindAccountForm
                employee={authTargetEmployee}
                initialEmail={rebindAuthEmail?.email}
                setFormRef={setRebindFormRef}
                onFinish={handleRebindAccount}
                isSubmitting={rebindEmployeeAuthAccountMutation.isPending}
                isLoadingInitialEmail={isFetchingRebindAuthEmail}
              />
            )
          : null}
      </Modal>
    </>
  )
}
