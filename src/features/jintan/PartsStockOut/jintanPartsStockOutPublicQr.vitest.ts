import { describe, expect, it } from 'vitest'

import {
  getJintanPartsStockOutPublicQrPath,
  getJintanPartsStockOutPublicQrValue,
  JINTAN_PARTS_STOCK_OUT_PUBLIC_QR_PATH,
} from './jintanPartsStockOutPublicQr'

describe('jintanPartsStockOutPublicQr', () => {
  it('公开二维码路径为免登录 H5 固定地址', () => {
    expect(JINTAN_PARTS_STOCK_OUT_PUBLIC_QR_PATH).toBe(
      '/h5/jintan-parts-stock-out',
    )
    expect(getJintanPartsStockOutPublicQrPath()).toBe(
      '/h5/jintan-parts-stock-out',
    )
  })

  it('二维码值为当前 origin + 路径', () => {
    expect(getJintanPartsStockOutPublicQrValue()).toBe(
      `${window.location.origin}/h5/jintan-parts-stock-out`,
    )
  })
})
