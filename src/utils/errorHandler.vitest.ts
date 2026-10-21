import { describe, expect, it, vi } from 'vitest'

import {
  AppError,
  getErrorTechnicalDetail,
  getUserErrorMessage,
  handleApiError,
} from './errorHandler'

vi.spyOn(console, 'error').mockImplementation(() => {})

describe('handleApiError', () => {
  it('translates known Postgres error codes and keeps the raw message as detail', () => {
    const error = handleApiError(
      {
        message: 'duplicate key value violates unique constraint "x_key"',
        code: '23505',
        details: 'Key (no)=(A1) already exists.',
      },
      '工装创建失败',
    )

    expect(error).toBeInstanceOf(AppError)
    expect(error.message).toBe('工装创建失败：数据已存在，请勿重复提交')
    expect(error.code).toBe('23505')
    expect(error.details).toContain('duplicate key value')
    expect(error.details).toContain('already exists')
  })

  it('does not leak unknown English messages into the user message', () => {
    const error = handleApiError(
      { message: 'some unexpected database failure', code: 'XX000' },
      '对账单删除失败',
    )

    expect(error.message).toBe('对账单删除失败')
    expect(error.details).toBe('some unexpected database failure')
  })

  it('keeps Chinese business errors raised by the database', () => {
    const error = handleApiError(
      { message: '库存不足，无法出库', code: 'P0001' },
      '出库失败',
    )

    expect(error.message).toBe('出库失败：库存不足，无法出库')
  })

  it('maps browser fetch failures to a network message', () => {
    const error = handleApiError(new TypeError('Failed to fetch'), '订单列表获取失败')

    expect(error.code).toBe('NETWORK_ERROR')
    expect(error.message).toBe('订单列表获取失败：网络连接失败，请检查网络设置')
  })
})

describe('getUserErrorMessage', () => {
  it('returns Chinese messages as-is', () => {
    expect(getUserErrorMessage(new Error('该员工当天已有工单'), '保存失败')).toBe(
      '该员工当天已有工单',
    )
  })

  it('translates known English messages', () => {
    expect(
      getUserErrorMessage(new Error('permission denied for table orders'), '保存失败'),
    ).toBe('没有权限访问当前数据表')
  })

  it('falls back for unknown English messages', () => {
    expect(getUserErrorMessage(new Error('boom'), '工单删除失败：请稍后重试')).toBe(
      '工单删除失败：请稍后重试',
    )
  })
})

describe('getErrorTechnicalDetail', () => {
  it('collects code and raw message for AppError', () => {
    const error = handleApiError({ message: 'boom', code: 'XX000' }, '保存失败')

    expect(getErrorTechnicalDetail(error)).toBe('错误码：XX000\nboom')
  })

  it('returns undefined when there is nothing technical to show', () => {
    expect(getErrorTechnicalDetail(new Error('库存不足'))).toBeUndefined()
  })
})
