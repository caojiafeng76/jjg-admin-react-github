import { beforeEach, describe, expect, it, vi } from 'vitest'

const functions = vi.hoisted(() => ({
  invoke: vi.fn(),
}))

vi.mock('./supabase', () => ({
  default: { functions },
}))

import {
  updateAdminManagementPassword,
  verifyAdminManagementPassword,
} from './apiAdminManagementPassword'

describe('apiAdminManagementPassword', () => {
  beforeEach(() => {
    functions.invoke.mockReset()
  })

  it('passes the password to the verification function', async () => {
    functions.invoke.mockResolvedValue({
      data: { verified: true },
      error: null,
    })

    await expect(verifyAdminManagementPassword('secret')).resolves.toEqual({
      verified: true,
    })
    expect(functions.invoke).toHaveBeenCalledWith(
      'verify-admin-management-password',
      { body: { password: 'secret' } },
    )
  })

  it('passes both passwords to the update function', async () => {
    functions.invoke.mockResolvedValue({
      data: { employeeId: 'employee-1', employeeName: '管理员' },
      error: null,
    })

    const values = { currentPassword: 'old', nextPassword: 'new' }
    await expect(updateAdminManagementPassword(values)).resolves.toEqual({
      employeeId: 'employee-1',
      employeeName: '管理员',
    })
    expect(functions.invoke).toHaveBeenCalledWith(
      'update-admin-management-password',
      { body: values },
    )
  })

  it('uses a trimmed error returned by the Edge Function response body', async () => {
    const json = vi.fn().mockResolvedValue({ error: '  密码错误  ' })
    functions.invoke.mockResolvedValue({
      data: null,
      error: { context: { json, status: 400 } },
    })

    const promise = verifyAdminManagementPassword('bad')
    await expect(promise).rejects.toMatchObject({
      code: 'VERIFY_ADMIN_MANAGEMENT_PASSWORD_FAILED',
      message: '密码错误',
    })
    expect(json).toHaveBeenCalledOnce()
  })

  it.each([
    [401, '未登录，无法执行此操作'],
    [403, '权限校验失败，无权执行此操作'],
    [404, 'Edge Function 不存在或未部署'],
  ])('maps an HTTP %i invoke failure', async (status, expectedMessage) => {
    functions.invoke.mockResolvedValue({
      data: null,
      error: { context: { status } },
    })

    await expect(verifyAdminManagementPassword('bad')).rejects.toMatchObject({
      code: 'VERIFY_ADMIN_MANAGEMENT_PASSWORD_FAILED',
      message: expectedMessage,
    })
  })

  it('falls back to status mapping when response JSON cannot be parsed', async () => {
    functions.invoke.mockResolvedValue({
      data: null,
      error: {
        context: {
          json: vi.fn().mockRejectedValue(new Error('invalid json')),
          status: 403,
        },
      },
    })

    await expect(verifyAdminManagementPassword('bad')).rejects.toThrow(
      '权限校验失败，无权执行此操作',
    )
  })

  it('preserves a normal invocation Error message', async () => {
    functions.invoke.mockResolvedValue({
      data: null,
      error: new Error('network unavailable'),
    })

    await expect(verifyAdminManagementPassword('bad')).rejects.toMatchObject({
      code: 'VERIFY_ADMIN_MANAGEMENT_PASSWORD_FAILED',
      message: 'network unavailable',
    })
  })

  it('adds the Edge Function name for an opaque invocation failure', async () => {
    functions.invoke.mockResolvedValue({ data: null, error: 'opaque failure' })

    await expect(
      updateAdminManagementPassword({
        currentPassword: 'old',
        nextPassword: 'new',
      }),
    ).rejects.toMatchObject({
      code: 'UPDATE_ADMIN_MANAGEMENT_PASSWORD_FAILED',
      message:
        '修改管理密码失败（Edge Function: update-admin-management-password）',
    })
  })

  it('rejects application errors returned in otherwise successful responses', async () => {
    functions.invoke.mockResolvedValueOnce({
      data: { error: '验证失败' },
      error: null,
    })
    await expect(verifyAdminManagementPassword('bad')).rejects.toMatchObject({
      code: 'VERIFY_ADMIN_MANAGEMENT_PASSWORD_FAILED',
      message: '验证失败',
    })

    functions.invoke.mockResolvedValueOnce({
      data: { error: '修改失败' },
      error: null,
    })
    await expect(
      updateAdminManagementPassword({
        currentPassword: 'old',
        nextPassword: 'new',
      }),
    ).rejects.toMatchObject({
      code: 'UPDATE_ADMIN_MANAGEMENT_PASSWORD_FAILED',
      message: '修改失败',
    })
  })
})
