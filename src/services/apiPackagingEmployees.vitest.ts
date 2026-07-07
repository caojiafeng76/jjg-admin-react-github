import { describe, expect, it, vi } from 'vitest'

vi.mock('./supabase', () => ({
  default: {},
}))

import { buildPackagingEmployeePayload } from './apiPackagingEmployees'

describe('buildPackagingEmployeePayload', () => {
  it('defaults missing hourly wage to 19', () => {
    expect(
      buildPackagingEmployeePayload({
        username: ' zhangsan ',
        name: ' 张三 ',
        position_salary: null,
        remark: null,
      }),
    ).toMatchObject({
      username: 'zhangsan',
      name: '张三',
      hourly_wage: 19,
    })
  })

  it('preserves explicit hourly wage values', () => {
    expect(
      buildPackagingEmployeePayload({
        username: 'lisi',
        name: '李四',
        position_salary: null,
        hourly_wage: 21.5,
        remark: null,
      }),
    ).toMatchObject({
      hourly_wage: 21.5,
    })
  })
})
