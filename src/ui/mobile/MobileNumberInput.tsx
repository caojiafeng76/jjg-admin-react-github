import { useEffect, useRef } from 'react'
import { InputNumber } from 'antd'
import type { InputNumberProps } from 'antd'

type MobileNumberKeyboardMode = 'numeric' | 'decimal'

export interface MobileNumberInputProps extends InputNumberProps<number> {
  keyboardMode?: MobileNumberKeyboardMode
}

export default function MobileNumberInput({
  keyboardMode = 'numeric',
  ...props
}: MobileNumberInputProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const input = wrapperRef.current?.querySelector('input')

    if (!input) {
      return
    }

    input.setAttribute('inputmode', keyboardMode)
    input.setAttribute(
      'pattern',
      keyboardMode === 'decimal' ? '[0-9]*[.,]?[0-9]*' : '[0-9]*',
    )
    input.setAttribute('enterkeyhint', 'done')
    input.setAttribute('autocomplete', 'off')
  }, [keyboardMode])

  return (
    <div ref={wrapperRef}>
      <InputNumber {...props} />
    </div>
  )
}
