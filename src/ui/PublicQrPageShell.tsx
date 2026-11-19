import type { ReactNode } from 'react'
import { Result, Spin } from 'antd'

export interface PublicQrPageShellProps {
  title: string
  description?: ReactNode
  /** 页头状态徽标，默认「免登录扫码登记」 */
  badge?: string
  /** 页头右侧补充区域（例如当前状态 StatusPill） */
  headerExtra?: ReactNode
  loading?: boolean
  loadingText?: string
  errorTitle?: string
  errorDescription?: ReactNode
  errorExtra?: ReactNode
  children?: ReactNode
  /** 底部吸底操作栏（可选） */
  footer?: ReactNode
}

/**
 * 免登录公开二维码页统一视觉壳（遵循 docs/前端页面风格规范与设计指南.md §4.2）。
 * 统一冷灰画布、品牌主色顶条、无衬线页头卡、完整暗色模式与移动端安全区适配。
 */
export default function PublicQrPageShell({
  title,
  description,
  badge = '免登录扫码登记',
  headerExtra,
  loading = false,
  loadingText = '正在加载数据...',
  errorTitle,
  errorDescription,
  errorExtra,
  children,
  footer,
}: PublicQrPageShellProps) {
  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-100 px-4 dark:bg-slate-950">
        <Spin size="large" description={loadingText} />
      </div>
    )
  }

  if (errorTitle) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-100 px-4 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Result
            status="error"
            title={errorTitle}
            subTitle={errorDescription}
            extra={errorExtra}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-dvh flex-col bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <main
        className={`mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col gap-4 overflow-y-auto px-4 pt-5 sm:px-6 sm:pt-8 ${
          footer
            ? 'pb-[calc(env(safe-area-inset-bottom)+96px)]'
            : 'pb-[calc(env(safe-area-inset-bottom)+24px)]'
        }`}
      >
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="h-1 w-full bg-primary" />
          <div className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {badge}
                </span>
                <h1 className="mt-2.5 text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  {title}
                </h1>
              </div>
              {headerExtra ? <div className="shrink-0">{headerExtra}</div> : null}
            </div>
            {description
              ? (
                  <p className="mt-2 mb-0 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    {description}
                  </p>
                )
              : null}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {children}
        </section>
      </main>

      {footer
        ? (
            <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
              <div className="mx-auto w-full max-w-xl">{footer}</div>
            </footer>
          )
        : null}
    </div>
  )
}
