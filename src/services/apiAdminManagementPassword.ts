import supabase from './supabase'
import { AppError } from '@/utils/errorHandler'

async function extractFunctionInvokeErrorMessage(error: unknown) {
  if (!error || typeof error !== 'object') {
    return null
  }

  const maybeContext = (
    error as {
      context?: {
        json?: () => Promise<unknown>
        status?: number
        statusText?: string
      }
    }
  ).context

  if (maybeContext?.json) {
    try {
      const payload = await maybeContext.json()

      if (
        payload &&
        typeof payload === 'object' &&
        'error' in payload &&
        typeof payload.error === 'string' &&
        payload.error.trim()
      ) {
        return payload.error.trim()
      }
    } catch {
      // ignore
    }
  }

  if (maybeContext?.status) {
    const status = maybeContext.status
    if (status === 401) return '未登录，无法执行此操作'
    if (status === 403) return '权限校验失败，无权执行此操作'
    if (status === 404) return 'Edge Function 不存在或未部署'
  }

  return null
}

async function throwFunctionInvokeError(
  error: unknown,
  fallbackMessage: string,
  code: string,
  functionName: string,
) {
  const detailedMessage = await extractFunctionInvokeErrorMessage(error)

  if (detailedMessage) {
    throw new AppError(detailedMessage, code)
  }

  if (error instanceof Error) {
    throw new AppError(error.message || fallbackMessage, code)
  }

  throw new AppError(
    `${fallbackMessage}（Edge Function: ${functionName}）`,
    code,
  )
}

export async function verifyAdminManagementPassword(password: string) {
  const { data, error } = await supabase.functions.invoke(
    'verify-admin-management-password',
    {
      body: { password },
    },
  )

  if (error) {
    await throwFunctionInvokeError(
      error,
      '验证管理密码失败',
      'VERIFY_ADMIN_MANAGEMENT_PASSWORD_FAILED',
      'verify-admin-management-password',
    )
  }

  if (data?.error) {
    throw new AppError(
      String(data.error),
      'VERIFY_ADMIN_MANAGEMENT_PASSWORD_FAILED',
    )
  }

  return data as { verified: boolean }
}

export async function updateAdminManagementPassword(values: {
  currentPassword: string
  nextPassword: string
}) {
  const { data, error } = await supabase.functions.invoke(
    'update-admin-management-password',
    {
      body: values,
    },
  )

  if (error) {
    await throwFunctionInvokeError(
      error,
      '修改管理密码失败',
      'UPDATE_ADMIN_MANAGEMENT_PASSWORD_FAILED',
      'update-admin-management-password',
    )
  }

  if (data?.error) {
    throw new AppError(
      String(data.error),
      'UPDATE_ADMIN_MANAGEMENT_PASSWORD_FAILED',
    )
  }

  return data as { employeeId: string; employeeName: string }
}