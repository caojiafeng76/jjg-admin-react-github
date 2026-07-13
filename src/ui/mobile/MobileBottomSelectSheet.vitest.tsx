import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'

import MobileBottomSelectSheet from './MobileBottomSelectSheet'

it('在保留默认本地过滤时可选通知远程搜索关键字', () => {
  const onSearch = vi.fn()

  const { rerender } = render(
    <MobileBottomSelectSheet
      open
      title="选择刀具资料"
      options={[{ value: 'tool-1', label: 'T001 | 铣刀', keywords: '合金' }]}
      onClose={vi.fn()}
      onSelect={vi.fn()}
      onSearch={onSearch}
    />,
  )

  const input = screen.getByPlaceholderText('请输入关键词搜索')
  fireEvent.compositionStart(input)
  fireEvent.change(input, { target: { value: '钻' } })
  expect(onSearch).not.toHaveBeenCalled()

  fireEvent.change(input, { target: { value: '钻头' } })
  fireEvent.compositionEnd(input)
  expect(onSearch).toHaveBeenCalledTimes(1)
  expect(onSearch).toHaveBeenCalledWith('钻头')

  rerender(
    <MobileBottomSelectSheet
      open={false}
      title="选择刀具资料"
      options={[]}
      onClose={vi.fn()}
      onSelect={vi.fn()}
      onSearch={onSearch}
    />,
  )
  expect(onSearch).toHaveBeenLastCalledWith('')
})
