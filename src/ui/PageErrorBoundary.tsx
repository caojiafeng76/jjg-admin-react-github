import type { ErrorInfo, ReactNode } from 'react'
import { ArrowPathIcon, HomeIcon } from '@heroicons/react/16/solid'
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { Button, Result } from 'antd'
import { Component } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDefaultHomeByRole } from '@/config/access'
import { useAuth } from '@/contexts'
import { getErrorDisplayInfo, getUserErrorMessage } from '@/utils/errorHandler'
import ErrorTechnicalDetail from './ErrorTechnicalDetail'

const CATEGORY_CONTENT = {
  network: { status: 'warning', title: '网络连接暂时不可用' },
  permission: { status: '403', title: '没有权限读取当前页面数据' },
  notFound: { status: '404', title: '数据不存在或已被删除' },
  generic: { status: 'error', title: '页面加载失败' },
} as const

export interface PageErrorFallbackProps {
  error: unknown
  onRetry: () => void
}

/** 布局内的页面错误态：只替换内容区，菜单与其他标签页不受影响 */
export function PageErrorFallback({ error, onRetry }: PageErrorFallbackProps) {
  const navigate = useNavigate()
  const { role } = useAuth()
  const { category } = getErrorDisplayInfo(error)
  const content = CATEGORY_CONTENT[category]

  return (
    <div className="flex h-full items-center justify-center overflow-auto">
      <Result
        status={content.status}
        title={content.title}
        subTitle={getUserErrorMessage(error, '页面暂时无法打开，请稍后重试')}
        extra={(
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-2">
              <Button
                type="primary"
                icon={<ArrowPathIcon className="size-4" />}
                onClick={onRetry}
              >
                重试
              </Button>
              <Button
                icon={<HomeIcon className="size-4" />}
                onClick={() =>
                  navigate(getDefaultHomeByRole(role), { replace: true })}
              >
                返回首页
              </Button>
            </div>
            <ErrorTechnicalDetail error={error} className="max-w-xl" />
          </div>
        )}
      />
    </div>
  )
}

interface BoundaryProps {
  children: ReactNode
  onReset: () => void
}

interface BoundaryState {
  error: unknown
  hasError: boolean
}

class PageErrorBoundaryInner extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: undefined, hasError: false }

  static getDerivedStateFromError(error: unknown): BoundaryState {
    return { error, hasError: true }
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    console.error('PageErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    // 先重置 TanStack Query 的错误状态，再重新渲染页面，触发失败查询重新请求
    this.props.onReset()
    this.setState({ error: undefined, hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <PageErrorFallback error={this.state.error} onRetry={this.handleRetry} />
      )
    }

    return this.props.children
  }
}

/**
 * 页面级错误边界（挂在每个 permissionRoute 上）。
 *
 * 查询首屏失败（全局 throwOnError）或渲染异常时，只在当前页面内容区展示错误 + 重试，
 * 不再冒泡到根路由 errorElement 把整个布局（菜单 / 所有缓存标签页）替换掉。
 */
export default function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <PageErrorBoundaryInner onReset={reset}>{children}</PageErrorBoundaryInner>
      )}
    </QueryErrorResetBoundary>
  )
}
