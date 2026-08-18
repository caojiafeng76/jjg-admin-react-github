import { InboxOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Empty, Result, Skeleton } from 'antd'
import type { ReactNode } from 'react'

/**
 * 表格三态通用组件（S1 UI 改版）
 *
 * 规格（docs/UI设计调研与改版指南.md §6.1）：
 * - 加载：骨架屏替代 spinner
 * - 空态：图标 + 一句话说明 + 引导动作
 * - 错误：错误说明 + 重试按钮（保留已填数据）
 *
 * 用法：
 * - `<TableState loading error onRetry>` 包裹 Table，自动处理加载/错误两态；
 *   空态通过 Table 的 `locale={{ emptyText: <TableEmpty /> }}` 注入。
 * - `loading` 传 `isLoading && !data`：首屏（无数据）显示骨架屏，
 *   分页/刷新（keepPreviousData 已有数据）不闪骨架屏，表格自带的 loading 兜底。
 */

export interface TableSkeletonProps {
  /** 骨架屏数据行数，默认 8 */
  rows?: number
}

/** 表格加载骨架屏：表头行 + 若干渐变行，替代 antd Table 默认 spinner */
export function TableSkeleton({ rows = 8 }: TableSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="数据加载中"
      className="px-4 py-6"
    >
      <Skeleton active avatar={false} title={{ width: '100%' }} paragraph={false} />
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton
          key={index}
          active
          avatar={false}
          title={{ width: `${100 - (index % 4) * 12}%` }}
          paragraph={false}
          className="mt-4"
        />
      ))}
    </div>
  )
}

export interface TableEmptyProps {
  /** 空态标题，默认「暂无数据」 */
  title?: string
  /** 一句话补充说明 */
  description?: string
  /** 引导动作（如「新建」按钮），透传到 Empty 的 children */
  action?: ReactNode
}

/** 引导式空态：图标 + 一句话 + 引导动作，用于 Table 的 locale.emptyText */
export function TableEmpty({
  title = '暂无数据',
  description,
  action,
}: TableEmptyProps) {
  return (
    <Empty
      image={<InboxOutlined className="text-slate-300 dark:text-slate-600" />}
      imageStyle={{ height: 48 }}
      description={
        <span className="text-slate-500 dark:text-slate-400">
          {title}
          {description ? (
            <span className="mt-1 block text-xs opacity-70">{description}</span>
          ) : null}
        </span>
      }
    >
      {action}
    </Empty>
  )
}

export interface TableErrorProps {
  /** 错误标题，默认「数据加载失败」 */
  title?: string
  /** 错误说明（失败原因），默认「请检查网络连接后重试」 */
  description?: string
  /** 重试回调（通常传 query 的 refetch） */
  onRetry?: () => void
}

/** 错误态：错误说明 + 重试按钮，保留已填数据（表格已渲染部分不受影响） */
export function TableError({
  title = '数据加载失败',
  description = '请检查网络连接后重试',
  onRetry,
}: TableErrorProps) {
  return (
    <Result
      status="error"
      title={title}
      subTitle={description}
      className="py-8"
      extra={
        onRetry ? (
          <Button type="primary" icon={<ReloadOutlined />} onClick={onRetry}>
            重试
          </Button>
        ) : undefined
      }
    />
  )
}

export interface TableStateProps {
  /** 首屏加载中（建议传 `isLoading && !data`），显示骨架屏 */
  loading: boolean
  /** 查询错误对象（query 的 error），非空时显示错误态 */
  error?: unknown
  /** 错误态重试回调（query 的 refetch） */
  onRetry?: () => void
  /** 正常态内容（表格本身） */
  children: ReactNode
}

/**
 * 表格三态组合组件：loading → 骨架屏；error → 错误重试；否则渲染 children。
 * 空态由页面在 Table 的 `locale={{ emptyText: <TableEmpty /> }}` 注入。
 */
export function TableState({
  loading,
  error,
  onRetry,
  children,
}: TableStateProps) {
  if (loading) {
    return <TableSkeleton />
  }

  if (error) {
    return <TableError onRetry={onRetry} />
  }

  return <>{children}</>
}