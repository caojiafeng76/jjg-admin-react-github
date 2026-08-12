import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/hooks/useMutationWithInvalidation', () => ({
  useMutationWithInvalidation: vi.fn(),
}))

import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import {
  useCreateStandardTime,
  useDeleteStandardTimes,
  useUpdateStandardTime,
  useUpdateStandardTimesLastProcess,
} from './useStandardTimes'

const useMutationWithInvalidationMock = vi.mocked(useMutationWithInvalidation)

/**
 * 约束：StandardTime 的写操作（新增/删除/编辑/末道标记）都必须
 * invalidate ['process-standards'] 前缀 —— 该前缀命中 dashboard 的
 * ['process-standards', 'job-rows'] 岗位行缓存，保证数据更新后
 * 仪表盘岗位列立即重算（而不是等 1 小时 staleTime 过期）。
 */
function expectInvalidatesProcessStandards(hook: () => unknown) {
  useMutationWithInvalidationMock.mockReturnValue({ mutate: vi.fn() } as never)
  hook()
  const options = useMutationWithInvalidationMock.mock.calls.at(-1)?.[0]
  expect(options?.invalidateQueries).toEqual(
    expect.arrayContaining([['process-standards']]),
  )
}

describe('useStandardTimes mutation invalidation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('useCreateStandardTime invalidates process-standards prefix', () => {
    expectInvalidatesProcessStandards(useCreateStandardTime)
  })

  it('useDeleteStandardTimes invalidates process-standards prefix', () => {
    expectInvalidatesProcessStandards(useDeleteStandardTimes)
  })

  it('useUpdateStandardTime invalidates process-standards prefix', () => {
    expectInvalidatesProcessStandards(useUpdateStandardTime)
  })

  it('useUpdateStandardTimesLastProcess invalidates process-standards prefix', () => {
    expectInvalidatesProcessStandards(useUpdateStandardTimesLastProcess)
  })
})
