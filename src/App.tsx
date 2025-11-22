import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, theme, App as AntdApp } from 'antd'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import AppLayout from '@ui/AppLayout'
import Dashboard from '@pages/Dashboard'
import Login from '@pages/Login'
import PageNotFound from '@pages/PageNotFound'
import SyneySpecList from '@pages/SyneySpecList'
import SyneyStoreReportList from '@pages/SyneyStoreReportList'
import SyneyStoreReportDetail from '@pages/SyneyStoreReportDetail'
import { useAppStore } from '@/store'
import SyneyPoList from './pages/SyneyPoList'
import SyneySetting from './pages/SyneySetting'
import SyneyPoDetail from './pages/SyneyPoDetail'

const queryClient = new QueryClient()

export default function App() {
  // const { darkMode } = useDarkMode()

  const { isDarkMode } = useAppStore()

  const themeMode = isDarkMode
    ? {
        // 1. 单独使用暗色算法
        algorithm: theme.darkAlgorithm,
        // 2. 组合使用暗色算法与紧凑算法
        // algorithm: [theme.darkAlgorithm, theme.compactAlgorithm],
      }
    : {}

  return (
    <ConfigProvider theme={themeMode}>
      <AntdApp>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route index element={<Navigate replace to="/dashboard" />} />
                <Route path="/dashboard" element={<Dashboard />} />

                <Route path="/syney-spec-list" element={<SyneySpecList />} />

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
              </Route>

              <Route path="/login" element={<Login />} />
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </BrowserRouter>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </AntdApp>
    </ConfigProvider>
  )
}
