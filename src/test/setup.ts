import '@testing-library/jest-dom/vitest'

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
