import React, { Component, ReactNode } from 'react'

import AppErrorView from '@ui/AppErrorView'
import { getErrorDisplayInfo } from '@/utils/errorHandler'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * 错误边界组件
 * 捕获子组件树中的 JavaScript 错误,显示备用 UI
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const errorInfo = getErrorDisplayInfo(
        this.state.error,
        '页面运行中断，请稍后重试。',
      )

      return (
        <AppErrorView
          variant={errorInfo.category}
          title="页面运行中断"
          badge="边界保护"
          description={errorInfo.message}
          detail={errorInfo.detail}
          code={errorInfo.code}
          actions={[
            {
              key: 'retry',
              label: '重试渲染',
              type: 'primary',
              onClick: this.handleReset,
            },
            {
              key: 'home',
              label: '返回首页',
              onClick: () => {
                window.location.href = '/'
              },
            },
          ]}
        />
      )
    }

    return this.props.children
  }
}
