import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'

// 项目未开启 Vitest `globals`，Testing Library 检测不到全局 afterEach，不会自动 cleanup。
// 不手动卸载的话，已渲染组件会一直挂载到测试文件结束，其中未清理的定时器（如 AppLayout
// 切页 150ms 的 setTimeout）可能在 jsdom 环境销毁后才触发，报 `window is not defined`。
afterEach(() => {
  cleanup()
})

const getComputedStyle = window.getComputedStyle.bind(window)
window.getComputedStyle = (element, pseudoElement) =>
  getComputedStyle(element, pseudoElement ? undefined : pseudoElement)

if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}

if (!globalThis.ResizeObserver) {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  globalThis.ResizeObserver = ResizeObserver
}
