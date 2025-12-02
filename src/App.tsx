import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, theme, App as AntdApp } from 'antd'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import AppLayout from '@ui/AppLayout'
import ErrorBoundary from '@ui/ErrorBoundary'
import Loading from '@ui/Loading'
import { useAppStore } from '@/store'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

// 懒加载页面组件
const Dashboard = lazy(() => import('@pages/Dashboard'))
const Login = lazy(() => import('@pages/Login'))
const PageNotFound = lazy(() => import('@pages/PageNotFound'))
const SyneySpecList = lazy(() => import('@pages/SyneySpecList'))
const SyneyStoreReportList = lazy(() => import('@pages/SyneyStoreReportList'))
const SyneyStoreReportDetail = lazy(
  () => import('@pages/SyneyStoreReportDetail'),
)
const SyneyPoList = lazy(() => import('./pages/SyneyPoList'))
const SyneySetting = lazy(() => import('./pages/SyneySetting'))
const SyneyPoDetail = lazy(() => import('./pages/SyneyPoDetail'))
const WorkshopOrderList = lazy(() => import('./pages/WorkshopOrderList'))
const WorkshopProcessList = lazy(() => import('./pages/WorkshopProcessList'))
const WorkshopDefectReasonList = lazy(() => import('./pages/WorkshopDefectReasonList'))
const EmployeeList = lazy(() => import('./pages/EmployeeList'))
const ProductionRecordList = lazy(() => import('./pages/ProductionRecordList'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 分钟
      retry: 1,
    },
  },
})

function ProtectedRoute({ element }: { element: JSX.Element }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <Loading />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return element
}

export default function App() {
  const { isDarkMode } = useAppStore()

  const themeMode = isDarkMode
    ? {
        // 使用暗色算法
        algorithm: theme.darkAlgorithm,
      }
    : {}

  // 配置静态方法（message、notification、modal）的全局设置
  useEffect(() => {
    ConfigProvider.config({
      holderRender: (children) => (
        <ConfigProvider theme={themeMode}>
          {children}
        </ConfigProvider>
      ),
    })
  }, [themeMode])

  return (
    <ErrorBoundary>
      <ConfigProvider theme={themeMode}>
        <AntdApp>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <BrowserRouter>
                <Suspense fallback={<Loading />}>
                  <Routes>
                    <Route
                      element={<ProtectedRoute element={<AppLayout />} />}
                    >
                    <Route
                      index
                      element={<Navigate replace to="/dashboard" />}
                    />
                    <Route path="/dashboard" element={<Dashboard />} />

                    <Route
                      path="/syney-spec-list"
                      element={<SyneySpecList />}
                    />

                    <Route
                      path="/syney-store-report-list"
                      element={<SyneyStoreReportList />}
                    />
                    <Route
                      path="/syney-store-report-list/:reportNo"
                      element={<SyneyStoreReportDetail />}
                    />

                    <Route path="/syney-po-list" element={<SyneyPoList />} />
                    <Route
                      path="/syney-po-list/:PoId"
                      element={<SyneyPoDetail />}
                    />

                    <Route path="/syney-setting" element={<SyneySetting />} />

                    <Route
                      path="/workshop-order-list"
                      element={<WorkshopOrderList />}
                    />
                    <Route
                      path="/workshop-process-list"
                      element={<WorkshopProcessList />}
                    />
                    <Route
                      path="/workshop-defect-reason-list"
                      element={<WorkshopDefectReasonList />}
                    />
                    <Route
                      path="/employee-list"
                      element={<EmployeeList />}
                    />
                    <Route
                      path="/production-record-list"
                      element={<ProductionRecordList />}
                    />
                  </Route>

                    <Route path="/login" element={<Login />} />
                    <Route path="*" element={<PageNotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </AuthProvider>
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProvider>
        </AntdApp>
      </ConfigProvider>
    </ErrorBoundary>
  )
}
