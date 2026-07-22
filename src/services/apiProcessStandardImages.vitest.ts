import { describe, expect, it } from 'vitest'

import {
  isSupportedProcessStandardImage,
  PROCESS_STANDARD_IMAGE_MAX_SIZE,
} from './apiProcessStandardImages'

describe('process standard image validation', () => {
  it('accepts the image formats supported by the storage bucket', () => {
    expect(
      isSupportedProcessStandardImage(
        new File(['png'], 'fixture.png', { type: 'image/png' }),
      ),
    ).toBe(true)
    expect(
      isSupportedProcessStandardImage(
        new File(['jpg'], 'fixture.jpg', { type: 'image/jpeg' }),
      ),
    ).toBe(true)
    expect(
      isSupportedProcessStandardImage(
        new File(['webp'], 'fixture.webp', { type: 'image/webp' }),
      ),
    ).toBe(true)
  })

  it('rejects unsupported mime types', () => {
    expect(
      isSupportedProcessStandardImage(
        new File(['text'], 'fixture.txt', { type: 'text/plain' }),
      ),
    ).toBe(false)
    expect(PROCESS_STANDARD_IMAGE_MAX_SIZE).toBe(10 * 1024 * 1024)
  })
})
