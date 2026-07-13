import { MutationObserver } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { createQueryClient } from './queryClient'

describe('createQueryClient', () => {
  it('calls a failed mutation exactly once by default', async () => {
    const queryClient = createQueryClient()
    const mutationFn = vi.fn().mockRejectedValue(new Error('request failed'))
    const observer = new MutationObserver(queryClient, { mutationFn })

    await expect(observer.mutate(undefined)).rejects.toThrow('request failed')

    expect(mutationFn).toHaveBeenCalledTimes(1)
    queryClient.clear()
  })
})
