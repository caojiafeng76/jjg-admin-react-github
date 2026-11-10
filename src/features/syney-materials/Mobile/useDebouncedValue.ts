import { useEffect, useState } from 'react'

/** 输入停顿后再更新，避免手机上每敲一个字就查一次库 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(setDebounced, delay, value)
    return () => clearTimeout(timer)
  }, [delay, value])

  return debounced
}
