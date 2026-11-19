import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import PublicQrPageShell from './PublicQrPageShell'

afterEach(cleanup)

describe('PublicQrPageShell', () => {
  it('renders loading state when loading is true', () => {
    render(<PublicQrPageShell title="工装登记" loading loadingText="正在读取工装资料" />)

    expect(screen.getByText('正在读取工装资料')).toBeTruthy()
    expect(screen.queryByRole('heading', { name: '工装登记' })).toBeNull()
  })

  it('renders error state when errorTitle is provided', () => {
    render(
      <PublicQrPageShell
        title="工装登记"
        errorTitle="二维码无效"
        errorDescription="未找到对应的工装资料"
      />,
    )

    expect(screen.getByText('二维码无效')).toBeTruthy()
    expect(screen.getByText('未找到对应的工装资料')).toBeTruthy()
  })

  it('renders unified header, body, headerExtra, and sticky footer', () => {
    render(
      <PublicQrPageShell
        title="劳保领用登记"
        description="扫码后直接登记领用信息"
        headerExtra={<span>可使用</span>}
        footer={<button type="button">提交登记</button>}
      >
        <div>表单主体</div>
      </PublicQrPageShell>,
    )

    expect(screen.getByText('免登录扫码登记')).toBeTruthy()
    expect(screen.getByRole('heading', { name: '劳保领用登记' })).toBeTruthy()
    expect(screen.getByText('扫码后直接登记领用信息')).toBeTruthy()
    expect(screen.getByText('可使用')).toBeTruthy()
    expect(screen.getByText('表单主体')).toBeTruthy()
    expect(screen.getByRole('button', { name: '提交登记' })).toBeTruthy()
  })
})
