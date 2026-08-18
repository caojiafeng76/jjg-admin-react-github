import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  TableEmpty,
  TableError,
  TableSkeleton,
  TableState,
} from './TableState'

afterEach(cleanup)

describe('TableSkeleton', () => {
  it('renders status region with given row count', () => {
    const { container } = render(<TableSkeleton rows={5} />)
    expect(screen.getByRole('status', { name: '数据加载中' })).toBeTruthy()
    // 1 个表头行 + 5 个数据行
    expect(container.querySelectorAll('.ant-skeleton').length).toBe(1 + 5)
  })

  it('defaults to 8 data rows', () => {
    const { container } = render(<TableSkeleton />)
    expect(container.querySelectorAll('.ant-skeleton').length).toBe(1 + 8)
  })
})

describe('TableEmpty', () => {
  it('renders title and description with defaults', () => {
    render(<TableEmpty />)
    expect(screen.getByText('暂无数据')).toBeTruthy()
  })

  it('renders custom title, description and action', () => {
    render(
      <TableEmpty
        title="暂无刀具资料"
        description="点击下方按钮创建第一条刀具资料"
        action={<button>新建刀具</button>}
      />,
    )
    expect(screen.getByText('暂无刀具资料')).toBeTruthy()
    expect(screen.getByText('点击下方按钮创建第一条刀具资料')).toBeTruthy()
    expect(screen.getByRole('button', { name: '新建刀具' })).toBeTruthy()
  })
})

describe('TableError', () => {
  it('renders error message and retry button', () => {
    render(<TableError onRetry={() => {}} />)
    expect(screen.getByText('数据加载失败')).toBeTruthy()
    expect(screen.getByRole('button', { name: /重试/ })).toBeTruthy()
  })

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = vi.fn()
    render(<TableError onRetry={onRetry} />)
    fireEvent.click(screen.getByRole('button', { name: /重试/ }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})

describe('TableState', () => {
  it('renders skeleton while loading', () => {
    render(
      <TableState loading error={null}>
        <div>表格内容</div>
      </TableState>,
    )
    expect(screen.getByRole('status', { name: '数据加载中' })).toBeTruthy()
    expect(screen.queryByText('表格内容')).toBeNull()
  })

  it('renders error view when error is present', () => {
    render(
      <TableState loading={false} error={new Error('boom')}>
        <div>表格内容</div>
      </TableState>,
    )
    expect(screen.getByText('数据加载失败')).toBeTruthy()
    expect(screen.queryByText('表格内容')).toBeNull()
  })

  it('renders children when loaded without error', () => {
    render(
      <TableState loading={false} error={null}>
        <div>表格内容</div>
      </TableState>,
    )
    expect(screen.getByText('表格内容')).toBeTruthy()
    expect(screen.queryByRole('status')).toBeNull()
  })
})