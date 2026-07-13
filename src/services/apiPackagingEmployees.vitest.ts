import { beforeEach, describe, expect, it, vi } from 'vitest'

const fromMock = vi.hoisted(() => vi.fn())

vi.mock('./supabase', () => ({
  default: { from: fromMock },
}))

import {
  buildPackagingEmployeePayload,
  getPackagingEmployeeList,
  getPackagingEmployeeOptions,
} from './apiPackagingEmployees'

beforeEach(() => {
  vi.clearAllMocks()
})

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

describe('getPackagingEmployeeList', () => {
  it('forwards the cancellation signal to PostgREST', async () => {
    const abortSignalMock = vi.fn().mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    })
    const rangeMock = vi.fn().mockReturnValue({
      abortSignal: abortSignalMock,
    })
    const orderMock = vi.fn().mockReturnValue({ range: rangeMock })
    const selectMock = vi.fn().mockReturnValue({ order: orderMock })
    fromMock.mockReturnValue({ select: selectMock })
    const signal = new AbortController().signal

    await getPackagingEmployeeList({
      page: 1,
      pageSize: 20,
      signal,
    })

    expect(abortSignalMock).toHaveBeenCalledWith(signal)
  })

  it('escapes PostgREST delimiters and LIKE wildcards in list searches', async () => {
    const response = { data: [], error: null, count: 0 }
    const rangeMock = vi.fn().mockResolvedValue(response)
    const orderMock = vi.fn().mockReturnValue({ range: rangeMock })
    const orMock = vi.fn().mockReturnValue({ order: orderMock })
    const selectMock = vi.fn().mockReturnValue({ or: orMock })
    fromMock.mockReturnValue({ select: selectMock })

    await getPackagingEmployeeList({
      page: 1,
      pageSize: 20,
      keyword: '50%_,(")\\',
    })

    expect(orMock).toHaveBeenCalledWith(
      String.raw`username.ilike."%50\\%\\_,(\")\\\\%",name.ilike."%50\\%\\_,(\")\\\\%"`,
    )
  })
})

describe('getPackagingEmployeeOptions', () => {
  function mockOptionsQuery(items: unknown[] = []) {
    const response = { data: items, error: null }
    const abortSignalMock = vi.fn().mockResolvedValue(response)
    const request = { ...response, abortSignal: abortSignalMock }
    const limitMock = vi.fn().mockReturnValue(request)
    const idOrderMock = vi.fn().mockReturnValue({ limit: limitMock })
    const nameOrderMock = vi.fn().mockReturnValue({ order: idOrderMock })
    const orMock = vi.fn().mockReturnValue({ order: nameOrderMock })
    const selectMock = vi.fn().mockReturnValue({
      or: orMock,
      order: nameOrderMock,
    })
    fromMock.mockReturnValue({ select: selectMock })

    return {
      abortSignalMock,
      idOrderMock,
      limitMock,
      nameOrderMock,
      orMock,
      selectMock,
    }
  }

  it('selects only option fields and clamps oversized searches to 50', async () => {
    const employee = { id: 'employee-1', name: '张三', username: 'zhangsan' }
    const query = mockOptionsQuery([employee])
    const signal = new AbortController().signal

    const result = await getPackagingEmployeeOptions({
      keyword: '  张三  ',
      limit: 500,
      signal,
    })

    expect(query.selectMock).toHaveBeenCalledWith('id,name,username')
    expect(query.orMock).toHaveBeenCalledWith(
      'username.ilike."%张三%",name.ilike."%张三%"',
    )
    expect(query.nameOrderMock).toHaveBeenCalledWith('name', {
      ascending: true,
    })
    expect(query.idOrderMock).toHaveBeenCalledWith('id', { ascending: true })
    expect(query.limitMock).toHaveBeenCalledWith(50)
    expect(query.abortSignalMock).toHaveBeenCalledWith(signal)
    expect(result).toEqual({ items: [employee] })
  })

  it('escapes PostgREST delimiters and LIKE wildcards in search terms', async () => {
    const query = mockOptionsQuery()

    await getPackagingEmployeeOptions({ keyword: '50%_,(")\\' })

    expect(query.orMock).toHaveBeenCalledWith(
      String.raw`username.ilike."%50\\%\\_,(\")\\\\%",name.ilike."%50\\%\\_,(\")\\\\%"`,
    )
  })

  it('skips blank filters and clamps undersized limits to one', async () => {
    const query = mockOptionsQuery()

    await getPackagingEmployeeOptions({ keyword: '   ', limit: -10 })

    expect(query.orMock).not.toHaveBeenCalled()
    expect(query.limitMock).toHaveBeenCalledWith(1)
    expect(query.abortSignalMock).not.toHaveBeenCalled()
  })
})
