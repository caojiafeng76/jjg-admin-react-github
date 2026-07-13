import { beforeEach, describe, expect, it, vi } from 'vitest'

interface QueryResult {
  data?: unknown
  error: { message: string } | null
}

interface QueryCall {
  args: unknown[]
  method: string
  table: string
}

interface QueryBuilder extends PromiseLike<QueryResult> {
  delete: (...args: unknown[]) => QueryBuilder
  eq: (...args: unknown[]) => QueryBuilder
  insert: (...args: unknown[]) => QueryBuilder
  order: (...args: unknown[]) => QueryBuilder
  select: (...args: unknown[]) => QueryBuilder
  upsert: (...args: unknown[]) => QueryBuilder
}

const database = vi.hoisted(() => ({
  calls: [] as QueryCall[],
  responses: [] as QueryResult[],
  rpc: vi.fn(),
}))

vi.mock('./supabase', () => ({
  default: {
    from: (table: string) => {
      const response = database.responses.shift() ?? { error: null }
      const builder = {} as QueryBuilder
      const chain =
        (method: string) =>
        (...args: unknown[]): QueryBuilder => {
          database.calls.push({ args, method, table })
          return builder
        }

      builder.delete = chain('delete')
      builder.eq = chain('eq')
      builder.insert = chain('insert')
      builder.order = chain('order')
      builder.select = chain('select')
      builder.upsert = chain('upsert')
      builder.then = (resolve, reject) =>
        Promise.resolve(response).then(resolve, reject)

      return builder
    },
    rpc: database.rpc,
  },
}))

vi.mock('@/utils/errorHandler', () => ({
  handleApiError: (error: { message: string }, message: string) =>
    new Error(`${message}: ${error.message}`),
}))

import {
  getAllPermissions,
  getMyPermissions,
  getRolePermissionIds,
  getUserPermissionOverrides,
  setRolePermissions,
  setUserPermissionOverrides,
  syncPermissionRegistry,
} from './apiPermissions'

function enqueue(...responses: QueryResult[]) {
  database.responses.push(...responses)
}

function callsFor(method: string) {
  return database.calls.filter((call) => call.method === method)
}

describe('apiPermissions', () => {
  beforeEach(() => {
    database.calls.length = 0
    database.responses.length = 0
    database.rpc.mockReset()
  })

  it('maps the current user permission rows by key', async () => {
    database.rpc.mockResolvedValue({
      data: [
        { enabled: true, key: 'page:orders' },
        { enabled: false, key: 'action:orders:delete' },
      ],
      error: null,
    })

    await expect(getMyPermissions()).resolves.toEqual({
      'action:orders:delete': false,
      'page:orders': true,
    })
    expect(database.rpc).toHaveBeenCalledWith('get_my_permissions')
  })

  it('returns an empty permission map for a null RPC payload', async () => {
    database.rpc.mockResolvedValue({ data: null, error: null })

    await expect(getMyPermissions()).resolves.toEqual({})
  })

  it('skips an empty registry and maps optional descriptions on upsert', async () => {
    await syncPermissionRegistry([])
    expect(database.calls).toEqual([])

    enqueue({ error: null })
    await syncPermissionRegistry([
      {
        key: 'page:orders',
        label: '订单',
        module: 'orders',
        scope: 'page',
        surface: 'pc',
      },
    ])

    expect(callsFor('upsert')).toEqual([
      expect.objectContaining({
        args: [
          [
            {
              description: null,
              key: 'page:orders',
              label: '订单',
              module: 'orders',
              scope: 'page',
              surface: 'pc',
            },
          ],
          { ignoreDuplicates: true, onConflict: 'key' },
        ],
        table: 'permissions',
      }),
    ])
  })

  it('loads permissions in stable module and scope order', async () => {
    const permission = {
      created_at: '2026-07-13T00:00:00Z',
      description: null,
      id: 'permission-1',
      key: 'page:orders',
      label: '订单',
      module: 'orders',
      scope: 'page',
      surface: 'admin',
    }
    enqueue({ data: [permission], error: null })

    await expect(getAllPermissions()).resolves.toEqual([permission])
    expect(callsFor('order').map((call) => call.args)).toEqual([
      ['module'],
      ['scope'],
    ])
  })

  it('loads role permission ids and replaces both nonempty and empty sets', async () => {
    enqueue({
      data: [
        { permission_id: 'permission-1' },
        { permission_id: 'permission-2' },
      ],
      error: null,
    })
    await expect(getRolePermissionIds('operator')).resolves.toEqual([
      'permission-1',
      'permission-2',
    ])

    enqueue({ error: null }, { error: null })
    await setRolePermissions('operator', ['permission-2'])
    expect(callsFor('insert').at(-1)).toEqual(
      expect.objectContaining({
        args: [[{ permission_id: 'permission-2', role: 'operator' }]],
        table: 'role_permissions',
      }),
    )

    const insertCount = callsFor('insert').length
    enqueue({ error: null })
    await setRolePermissions('operator', [])
    expect(callsFor('insert')).toHaveLength(insertCount)
  })

  it('loads and replaces user-specific permission overrides', async () => {
    const override = {
      created_at: '2026-07-13T00:00:00Z',
      employee_id: 'employee-1',
      enabled: false,
      id: 'override-1',
      permission_id: 'permission-1',
    }
    enqueue({ data: [override], error: null })
    await expect(getUserPermissionOverrides('employee-1')).resolves.toEqual([
      override,
    ])

    enqueue({ error: null }, { error: null })
    await setUserPermissionOverrides('employee-1', [
      { enabled: true, permissionId: 'permission-2' },
    ])

    expect(callsFor('insert').at(-1)).toEqual(
      expect.objectContaining({
        args: [
          [
            {
              employee_id: 'employee-1',
              enabled: true,
              permission_id: 'permission-2',
            },
          ],
        ],
        table: 'user_permission_overrides',
      }),
    )
  })

  it('stops replacements when deleting old bindings fails', async () => {
    enqueue({ error: { message: 'delete denied' } })
    await expect(
      setRolePermissions('operator', ['permission-1']),
    ).rejects.toThrow('角色权限更新失败（清除旧记录）: delete denied')

    enqueue({ error: { message: 'delete denied' } })
    await expect(
      setUserPermissionOverrides('employee-1', [
        { enabled: true, permissionId: 'permission-1' },
      ]),
    ).rejects.toThrow('用户权限覆盖更新失败（清除旧记录）: delete denied')
  })

  it('surfaces RPC, registry, read, and insert failures', async () => {
    database.rpc.mockResolvedValue({
      data: null,
      error: { message: 'rpc denied' },
    })
    await expect(getMyPermissions()).rejects.toThrow('权限加载失败: rpc denied')

    enqueue({ error: { message: 'upsert denied' } })
    await expect(
      syncPermissionRegistry([
        {
          description: '订单入口',
          key: 'page:orders',
          label: '订单',
          module: 'orders',
          scope: 'page',
          surface: 'pc',
        },
      ]),
    ).rejects.toThrow('权限注册表同步失败: upsert denied')

    enqueue({ data: null, error: { message: 'read denied' } })
    await expect(getAllPermissions()).rejects.toThrow(
      '权限列表加载失败: read denied',
    )

    enqueue({ error: null }, { error: { message: 'insert denied' } })
    await expect(
      setRolePermissions('operator', ['permission-1']),
    ).rejects.toThrow('角色权限更新失败（写入新记录）: insert denied')

    enqueue({ error: null }, { error: { message: 'insert denied' } })
    await expect(
      setUserPermissionOverrides('employee-1', [
        { enabled: false, permissionId: 'permission-1' },
      ]),
    ).rejects.toThrow('用户权限覆盖更新失败（写入新记录）: insert denied')
  })
})
