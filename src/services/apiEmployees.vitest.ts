import { describe, expect, it, vi } from 'vitest'

import {
  buildEmployeeCreatePayload,
  buildEmployeeUpdatePayload,
} from './apiEmployees'

vi.mock('./supabase', () => ({
  default: {},
}))

describe('employee payload builders', () => {
  it('defaults new employees to not external', () => {
    expect(
      buildEmployeeCreatePayload({
        name: ' 张三 ',
      }),
    ).toMatchObject({
      name: '张三',
      is_external: false,
    })
  })

  it('preserves explicit external employee values', () => {
    expect(
      buildEmployeeCreatePayload({
        name: '李四',
        is_external: true,
      }),
    ).toMatchObject({
      is_external: true,
    })
  })

  it('defaults missing external flag to false on update', () => {
    expect(
      buildEmployeeUpdatePayload({
        name: '王五',
      }),
    ).toMatchObject({
      is_external: false,
    })
  })
})
