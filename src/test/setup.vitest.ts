import { afterEach, describe, expect, test, vi } from 'vitest'

describe('test environment setup', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('supports pseudo-element styles without affecting normal computed styles', () => {
    const element = document.createElement('div')
    element.style.color = 'red'
    document.body.append(element)
    const jsdomError = vi.fn()
    const virtualConsole = (
      window as unknown as {
        _virtualConsole: {
          on: (event: string, listener: (...args: unknown[]) => void) => void
          removeListener: (
            event: string,
            listener: (...args: unknown[]) => void,
          ) => void
        }
      }
    )._virtualConsole
    virtualConsole.on('jsdomError', jsdomError)

    const normalStyle = window.getComputedStyle(element)
    const pseudoStyle = window.getComputedStyle(element, '::before')

    expect(normalStyle.color).toBe('rgb(255, 0, 0)')
    expect(pseudoStyle).toBeInstanceOf(CSSStyleDeclaration)
    expect(jsdomError).not.toHaveBeenCalled()

    virtualConsole.removeListener('jsdomError', jsdomError)
    element.remove()
  })
})
