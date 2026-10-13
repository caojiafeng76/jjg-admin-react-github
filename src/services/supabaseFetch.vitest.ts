import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createRetryingFetch } from './supabaseFetch'

const URL_REST = 'https://proxy.example.com/rest/v1/items?select=id'

function networkError() {
  return new TypeError('Failed to fetch')
}

describe('createRetryingFetch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('网络错误时重试 GET 请求，直到成功', async () => {
    const baseFetch = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(networkError())
      .mockRejectedValueOnce(networkError())
      .mockResolvedValueOnce(new Response('[]', { status: 200 }))
    const retryingFetch = createRetryingFetch(baseFetch)

    const promise = retryingFetch(URL_REST, { method: 'GET' })
    await vi.advanceTimersByTimeAsync(300)
    await vi.advanceTimersByTimeAsync(1000)
    const response = await promise

    expect(response.status).toBe(200)
    expect(baseFetch).toHaveBeenCalledTimes(3)
  })

  it('超过最大重试次数后抛出原始错误', async () => {
    const error = networkError()
    const baseFetch = vi.fn<typeof fetch>().mockRejectedValue(error)
    const retryingFetch = createRetryingFetch(baseFetch, {
      retryDelays: [10, 20],
    })

    const promise = retryingFetch(URL_REST)
    const assertion = expect(promise).rejects.toBe(error)
    await vi.advanceTimersByTimeAsync(30)
    await assertion

    expect(baseFetch).toHaveBeenCalledTimes(3)
  })

  it.each(['POST', 'PATCH', 'DELETE'])('%s 请求不重试', async (method) => {
    const error = networkError()
    const baseFetch = vi.fn<typeof fetch>().mockRejectedValue(error)
    const retryingFetch = createRetryingFetch(baseFetch)

    await expect(retryingFetch(URL_REST, { method })).rejects.toBe(error)
    expect(baseFetch).toHaveBeenCalledTimes(1)
  })

  it('HTTP 错误响应原样返回，不重试', async () => {
    const baseFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('{}', { status: 500 }))
    const retryingFetch = createRetryingFetch(baseFetch)

    const response = await retryingFetch(URL_REST)

    expect(response.status).toBe(500)
    expect(baseFetch).toHaveBeenCalledTimes(1)
  })

  it('请求被取消时不重试', async () => {
    const abortError = new DOMException('aborted', 'AbortError')
    const baseFetch = vi.fn<typeof fetch>().mockRejectedValue(abortError)
    const retryingFetch = createRetryingFetch(baseFetch)

    await expect(retryingFetch(URL_REST)).rejects.toBe(abortError)
    expect(baseFetch).toHaveBeenCalledTimes(1)
  })

  it('等待重试期间取消请求，立即停止', async () => {
    const controller = new AbortController()
    const baseFetch = vi.fn<typeof fetch>().mockRejectedValue(networkError())
    const retryingFetch = createRetryingFetch(baseFetch)

    const promise = retryingFetch(URL_REST, { signal: controller.signal })
    const assertion = expect(promise).rejects.toMatchObject({
      name: 'AbortError',
    })
    await vi.advanceTimersByTimeAsync(100)
    controller.abort()
    await assertion

    expect(baseFetch).toHaveBeenCalledTimes(1)
  })

  it('Request 对象重试时每次传入新的副本', async () => {
    const baseFetch = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(networkError())
      .mockResolvedValueOnce(new Response('[]', { status: 200 }))
    const retryingFetch = createRetryingFetch(baseFetch, { retryDelays: [0] })
    const request = new Request(URL_REST)

    const promise = retryingFetch(request)
    await vi.advanceTimersByTimeAsync(0)
    await promise

    const [first, second] = baseFetch.mock.calls.map(([input]) => input)
    expect(first).toBeInstanceOf(Request)
    expect(second).toBeInstanceOf(Request)
    expect(first).not.toBe(second)
  })
})
