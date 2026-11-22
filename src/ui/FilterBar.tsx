import type { ButtonProps } from 'antd'
import type { ReactNode } from 'react'
import { ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/react/16/solid'
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
  onSearch?: () => void
  isLoading?: boolean
  size?: ButtonProps['size']
  searchText?: string
  resetText?: string
  className?: string
}

/** 筛选栏末尾标准操作按钮组：固定「搜索」（回车提交或 onSearch）+「重置」，统一内置 16px solid 前置图标 */
export function FilterBarActions({
  onReset,
  onSearch,
  isLoading = false,
  size,
  searchText = '搜索',
  resetText = '重置',
  className,
}: FilterBarActionsProps) {
  const buttons = (
    <>
      <Button
        type="primary"
        htmlType={onSearch ? 'button' : 'submit'}
        size={size}
        icon={<MagnifyingGlassIcon className="size-4" />}
        loading={isLoading}
        onClick={onSearch}
      >
        {searchText}
      </Button>
      <Button
        size={size}
        icon={<ArrowPathIcon className="size-4" />}
        onClick={onReset}
        disabled={isLoading}
      >
        {resetText}
      </Button>
    </>
  )

  if (className) {
    return <div className={className}>{buttons}</div>
  }

  return <Space size={8}>{buttons}</Space>
}
