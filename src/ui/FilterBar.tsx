import type { ReactNode } from 'react'
import { Button, Space } from 'antd'

export interface FilterBarProps {
  children: ReactNode
  className?: string
  ariaLabel?: string
}

/**
 * 桌面端列表页统一筛选栏容器（极简扁平单层，去白卡套娃）。
 * 使用轻量灰底 + 1px 淡边框，不加阴影，不加“筛选条件”蓝点标题。
 */
export default function FilterBar({
  children,
  className = '',
  ariaLabel = '筛选条件',
}: FilterBarProps) {
  return (
    <section
      aria-label={ariaLabel}
      className={`rounded-lg border border-slate-200/70 bg-slate-50/80 px-3 py-2.5 dark:border-slate-700/70 dark:bg-slate-900/50 ${className}`.trim()}
    >
      {children}
    </section>
  )
}

export interface FilterBarActionsProps {
  onReset: () => void
  isLoading?: boolean
  searchText?: string
  resetText?: string
}

/** 筛选栏末尾标准操作按钮组：固定「搜索」（回车提交）+「重置」 */
export function FilterBarActions({
  onReset,
  isLoading = false,
  searchText = '搜索',
  resetText = '重置',
}: FilterBarActionsProps) {
  return (
    <Space size={8}>
      <Button type="primary" htmlType="submit" loading={isLoading}>
        {searchText}
      </Button>
      <Button onClick={onReset} disabled={isLoading}>
        {resetText}
      </Button>
    </Space>
  )
}
