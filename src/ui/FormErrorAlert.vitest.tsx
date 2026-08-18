import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import FormErrorAlert from './FormErrorAlert'

afterEach(cleanup)

describe('FormErrorAlert', () => {
  it('renders nothing when error is null', () => {
    const { container } = render(<FormErrorAlert error={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders three-part feedback with auto-extracted reason', () => {
    render(<FormErrorAlert error={new Error('保存失败')} />)
    expect(screen.getByText('操作失败')).toBeTruthy()
    expect(screen.getByText(/失败原因：/)).toBeTruthy()
    expect(screen.getByText(/保存失败/)).toBeTruthy()
    expect(screen.getByText(/影响：/)).toBeTruthy()
    expect(screen.getByText(/本次操作未生效/)).toBeTruthy()
    expect(screen.getByText(/建议：/)).toBeTruthy()
    expect(screen.getByText(/根据失败原因调整后重试/)).toBeTruthy()
  })

  it('uses custom reason, impact and suggestion when provided', () => {
    render(
      <FormErrorAlert
        error={new Error('原始错误')}
        reason="库存数量不足"
        impact="本次入库单未创建"
        suggestion="请先补充库存后再操作"
      />,
    )
    expect(screen.getByText(/库存数量不足/)).toBeTruthy()
    expect(screen.getByText(/本次入库单未创建/)).toBeTruthy()
    expect(screen.getByText(/请先补充库存后再操作/)).toBeTruthy()
    expect(screen.queryByText(/原始错误/)).toBeNull()
  })

  it('translates known English errors to Chinese', () => {
    render(<FormErrorAlert error={new Error('permission denied for table tooling_data')} />)
    expect(screen.getByText(/没有权限访问当前数据表/)).toBeTruthy()
  })
})