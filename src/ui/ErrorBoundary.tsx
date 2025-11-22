import React, { Component, ReactNode } from 'react'
import { Result, Button } from 'antd'

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

      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            padding: '24px',
          }}
        >
          <Result
            status="error"
            title="页面出错了"
            subTitle={this.state.error?.message || '抱歉,页面遇到了一些问题。'}
            extra={[
              <Button type="primary" key="reload" onClick={this.handleReset}>
                重新加载
              </Button>,
              <Button
                key="home"
                onClick={() => (window.location.href = '/dashboard')}
              >
                返回首页
              </Button>,
            ]}
          />
        </div>
      )
    }

    return this.props.children
  }
}
