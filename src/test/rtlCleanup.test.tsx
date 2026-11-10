import { render } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'

// 守卫 src/test/setup.ts 中的全局 cleanup：每个用例结束后必须卸载已渲染的组件，
// 否则组件内未清理的定时器会在 jsdom 销毁后触发，导致 Vitest 报 unhandled error。
const onUnmount = vi.fn()

function Probe() {
  useEffect(() => onUnmount, [])
  return <div>rtl cleanup probe</div>
}

describe('testing library cleanup', () => {
  it('renders a component', () => {
    render(<Probe />)
    expect(document.body).toHaveTextContent('rtl cleanup probe')
  })

  it('unmounts components rendered by the previous test', () => {
    expect(onUnmount).toHaveBeenCalledTimes(1)
    expect(document.body.innerHTML).toBe('')
  })
})
