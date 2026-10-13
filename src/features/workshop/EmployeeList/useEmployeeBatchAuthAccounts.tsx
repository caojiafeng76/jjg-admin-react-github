import { useCallback, useState } from 'react'
import type { Dispatch, Key, SetStateAction } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'

import {
  createEmployeeAuthAccount,
  type Employee,
} from '@/services/apiEmployees'
import {
  DEFAULT_EMPLOYEE_AUTH_PASSWORD,
  EMPLOYEE_AUTH_EMAIL_DOMAIN,
} from './constants'
import { buildBatchEmployeeAuthEmails } from './email'

interface UseEmployeeBatchAuthAccountsOptions {
  data: { items: Employee[] } | undefined
  selectedRowKeys: Key[]
  setSelectedRowKeys: Dispatch<SetStateAction<Key[]>>
}

export function useEmployeeBatchAuthAccounts({
  data,
  selectedRowKeys,
  setSelectedRowKeys,
}: UseEmployeeBatchAuthAccountsOptions) {
  const { message, modal } = App.useApp()
  const queryClient = useQueryClient()
  const [isBatchCreatingAuth, setIsBatchCreatingAuth] = useState(false)

  const handleBatchCreateAuthAccounts = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要批量开通账号的员工')
      return
    }

    const selectedEmployees = (data?.items || []).filter(
      (item) => item.id && selectedRowKeys.includes(item.id),
    )

    if (selectedEmployees.length === 0) {
      message.warning('未找到所选员工')
      return
    }

    const targetEmployees = selectedEmployees.filter(
      (item) => !item.auth_user_id,
    )
    const skippedEmployees = selectedEmployees.filter(
      (item) => item.auth_user_id,
    )

    if (targetEmployees.length === 0) {
      message.warning('所选员工都已绑定账号，无需批量开通')
      return
    }

    const plans = await buildBatchEmployeeAuthEmails(targetEmployees)

    modal.confirm({
      title: '批量开通员工账号',
      okText: '确认开通',
      cancelText: '取消',
      width: 640,
      content: (
        <div className="space-y-3 text-sm text-slate-600">
          <p>
            将为 <strong>{targetEmployees.length}</strong>{' '}
            名员工批量开通账号，默认密码为{' '}
            <strong>{DEFAULT_EMPLOYEE_AUTH_PASSWORD}</strong>。
          </p>
          <p>
            邮箱规则：员工姓名拼音{' '}
            <strong>@{EMPLOYEE_AUTH_EMAIL_DOMAIN}</strong>
            。同名员工会自动追加数字后缀。
          </p>
          {skippedEmployees.length > 0 ? (
            <p className="text-amber-600">
              已跳过 {skippedEmployees.length} 名已绑定账号员工。
            </p>
          ) : null}
          <div className="rounded-2xl bg-slate-50 px-3 py-3">
            <div className="mb-2 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
              邮箱预览
            </div>
            <div className="space-y-1 text-sm text-slate-700">
              {plans.slice(0, 5).map((plan) => (
                <div key={plan.employee.id}>
                  {plan.employee.name}
                  {' -> '}
                  {plan.email}
                </div>
              ))}
              {plans.length > 5 ? (
                <div className="text-slate-400">
                  还有 {plans.length - 5} 名员工未展开
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ),
      onOk: async () => {
        setIsBatchCreatingAuth(true)

        const successResults: Array<{ employeeName: string; email: string }> =
          []
        const failedResults: Array<{
          employeeName: string
          email: string
          reason: string
        }> = []

        try {
          for (const plan of plans) {
            if (!plan.employee.id) {
              failedResults.push({
                employeeName: plan.employee.name,
                email: plan.email,
                reason: '员工 ID 缺失',
              })
              continue
            }

            try {
              const result = await createEmployeeAuthAccount({
                employeeId: plan.employee.id,
                email: plan.email,
                password: DEFAULT_EMPLOYEE_AUTH_PASSWORD,
              })

              successResults.push({
                employeeName: result.employeeName,
                email: result.email,
              })
            } catch (error) {
              failedResults.push({
                employeeName: plan.employee.name,
                email: plan.email,
                reason: error instanceof Error ? error.message : '创建失败',
              })
            }
          }

          await queryClient.invalidateQueries({ queryKey: ['employees'] })
          setSelectedRowKeys([])

          if (successResults.length > 0) {
            message.success(
              `批量开通完成，成功 ${successResults.length} 个账号`,
            )
          }

          if (failedResults.length > 0) {
            modal.warning({
              title: '部分账号开通失败',
              okText: '知道了',
              width: 720,
              content: (
                <div className="space-y-3 text-sm text-slate-600">
                  <p>
                    成功 <strong>{successResults.length}</strong> 个，失败{' '}
                    <strong>{failedResults.length}</strong> 个。
                  </p>
                  <div className="max-h-72 space-y-2 overflow-y-auto rounded-2xl bg-slate-50 px-3 py-3">
                    {failedResults.map((item) => (
                      <div
                        key={`${item.employeeName}-${item.email}`}
                        className="rounded-xl bg-white px-3 py-2"
                      >
                        <div className="font-medium text-slate-800">
                          {item.employeeName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.email}
                        </div>
                        <div className="mt-1 text-xs text-rose-500">
                          {item.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ),
            })
          }
        } finally {
          setIsBatchCreatingAuth(false)
        }
      },
    })
  }, [
    data?.items,
    message,
    modal,
    queryClient,
    selectedRowKeys,
    setSelectedRowKeys,
  ])

  return { handleBatchCreateAuthAccounts, isBatchCreatingAuth }
}
