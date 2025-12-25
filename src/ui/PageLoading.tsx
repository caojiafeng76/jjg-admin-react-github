import { Spin } from 'antd'

/**
 * 页面加载组件
 * 用于页面数据加载时的 loading 状态展示
 * 相比 Loading 组件，这个组件更适合在页面内容区域使用
 */
export default function PageLoading() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '300px',
        width: '100%',
      }}
    >
      <Spin size="large" tip="加载中..." />
    </div>
  )
}

