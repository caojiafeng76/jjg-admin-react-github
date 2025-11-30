import { Spin } from 'antd'

/**
 * 加载占位组件
 * 用于路由懒加载时的 Suspense fallback
 */
export default function Loading() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        width: '100%',
      }}
    >
      <div style={{ minWidth: '120px', textAlign: 'center' }}>
        <Spin size="large" tip="加载中...">
          <div style={{ minHeight: '2rem', width: '2rem' }} />
        </Spin>
      </div>
    </div>
  )
}
