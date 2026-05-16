import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { clearFontCache, loadGoogleFont } from './googleFontLoader'

const originalFetch = globalThis.fetch

function okFontResponse(bytes: number[]): Response {
  return new Response(new Uint8Array(bytes).buffer, { status: 200 })
}

describe('google font loader', () => {
  beforeEach(() => {
    clearFontCache()
  })

  afterEach(() => {
    clearFontCache()
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('loads the same-origin bundled font before trying remote fonts', async () => {
    const fetchMock = vi.fn(async () => okFontResponse([65, 66]))
    globalThis.fetch = fetchMock as typeof fetch

    const fontData = await loadGoogleFont()

    expect(fontData).toBe('QUI=')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('/fonts/NotoSansSC.ttf')
  })

  it('falls back to the remote font when the bundled font is missing', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(okFontResponse([67, 68]))
    globalThis.fetch = fetchMock as typeof fetch

    const fontData = await loadGoogleFont()

    expect(fontData).toBe('Q0Q=')
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/fonts/NotoSansSC.ttf')
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://fonts.gstatic.com/s/notosanssc/v37/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_FnYxNbPzS5HE.ttf',
    )
  })

  it('reports a Chinese diagnostic when every font source fails', async () => {
    const fetchMock = vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    })
    globalThis.fetch = fetchMock as typeof fetch

    await expect(loadGoogleFont()).rejects.toThrow(
      '中文字体加载失败，请检查网络或本地字体文件',
    )
  })
})
