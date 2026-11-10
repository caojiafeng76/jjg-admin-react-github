import type { ReactNode } from 'react'
import { ArrowLeftIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { Alert, Button, Empty, Input, Spin } from 'antd'
import { useNavigate } from 'react-router-dom'

import { getUserErrorMessage } from '@/utils/errorHandler'

export interface SyneyMaterialsMobileShellProps {
  title: string
  description: string
  searchValue: string
  onSearchChange: (value: string) => void
  /** 首次加载（还没有任何数据） */
  loading: boolean
  error: unknown
  onRetry: () => void
  isEmpty: boolean
  emptyText: string
  shownCount: number
  total: number
  loadingMore: boolean
  onLoadMore: () => void
  /** 固定在底部导航上方的主操作 */
  footer?: ReactNode
  children: ReactNode
}

/** 西尼材料手机页骨架：标题卡片 → 吸顶搜索 → 卡片列表 → 加载更多 → 底部主操作 */
export default function SyneyMaterialsMobileShell({
  title,
  description,
  searchValue,
  onSearchChange,
  loading,
  error,
  onRetry,
  isEmpty,
  emptyText,
  shownCount,
  total,
  loadingMore,
  onLoadMore,
  footer,
  children,
}: SyneyMaterialsMobileShellProps) {
  const navigate = useNavigate()

  return (
    <div className={`h-full overflow-y-auto ${footer ? 'pb-36' : 'pb-8'}`}>
      <div className="mx-auto flex max-w-2xl flex-col gap-3 px-4 pt-4">
        <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-4 shadow-[0_20px_50px_rgba(15,23,42,0.08)] dark:border-slate-700/80 dark:bg-slate-900/90">
          <button
            type="button"
            onClick={() => navigate('/scan')}
            className="-ml-1 flex items-center gap-1 py-1 text-sm text-slate-500 active:text-slate-900 dark:text-slate-400"
          >
            <ArrowLeftIcon className="size-4" />
            返回扫码
          </button>
          <div className="mt-2 text-[11px] font-semibold tracking-[0.28em] text-slate-400 uppercase dark:text-slate-500">
            西尼材料
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            {title}
          </h1>
          <p className="mt-1 mb-0 text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </section>

        <div className="sticky top-0 z-10 -mx-4 bg-white/90 px-4 py-2 backdrop-blur-xl dark:bg-slate-900/90">
          <Input
            size="large"
            allowClear
            value={searchValue}
            onChange={event => onSearchChange(event.target.value)}
            placeholder="搜索品名或规格"
            aria-label="搜索品名或规格"
            prefix={<MagnifyingGlassIcon className="size-5 text-slate-400" />}
            className="rounded-2xl"
            enterKeyHint="search"
          />
        </div>

        {error
          ? (
              <Alert
                type="error"
                showIcon
                title={getUserErrorMessage(error, '加载失败，请稍后重试')}
                action={(
                  <Button size="small" onClick={onRetry}>
                    重试
                  </Button>
                )}
              />
            )
          : loading
            ? (
                <div className="flex h-48 items-center justify-center">
                  <Spin />
                </div>
              )
            : isEmpty
              ? (
                  <div className="flex h-48 items-center justify-center">
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />
                  </div>
                )
              : (
                  <>
                    <div className="flex flex-col gap-3">{children}</div>
                    {shownCount < total
                      ? (
                          <Button
                            size="large"
                            block
                            loading={loadingMore}
                            onClick={onLoadMore}
                            className="h-12 rounded-2xl"
                          >
                            加载更多（{shownCount} / {total}）
                          </Button>
                        )
                      : (
                          <div className="py-2 text-center text-xs text-slate-400">
                            共 {total} 条，已全部显示
                          </div>
                        )}
                  </>
                )}
      </div>

      {footer
        ? (
            <div
              className="fixed inset-x-0 z-40 border-t border-white/70 bg-white/92 px-4 pt-3 pb-3 backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/92"
              style={{ bottom: 'calc(env(safe-area-inset-bottom) + 82px)' }}
            >
              <div className="mx-auto max-w-2xl">{footer}</div>
            </div>
          )
        : null}
    </div>
  )
}
