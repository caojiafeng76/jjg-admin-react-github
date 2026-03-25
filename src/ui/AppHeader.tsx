import {
  Bars3BottomLeftIcon,
  Bars3BottomRightIcon,
} from '@heroicons/react/16/solid'
import { Button } from 'antd'
import { Header } from 'antd/es/layout/layout'
import { useLocation, useNavigate } from 'react-router-dom'

import DarkModeButton from '@ui/DarkModeButton'
import { getRoleLabel } from '@/config/access'
import { useAuth } from '@/contexts/AuthContext'

// 路由到页面名称的映射
const routeToLabelMap: Record<string, string> = {
  dashboard: '首页',
  'syney-po-list': '订单列表',
  'syney-store-report-list': '入库单列表',
  'syney-spec-list': '踏板规格列表',
  'syney-safe-part-setting': '安全件设置',
  'syney-setting': '编号设置',
  'workshop-order-list': '订单管理',
  'workshop-process-list': '工序管理',
  'workshop-defect-reason-list': '不良原因管理',
  'employee-list': '员工管理',
  'standard-time-list': '成本核算',
  'production-order': '生产工单',
  'production-daily-report': '生产日报表',
}

export default function AppHeader({
  colorBgContainer,
  collapsed,
  onToggleCollapse,
}: {
  colorBgContainer: string
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, role, employeeProfile, signOut } = useAuth()
  const currentPath = location.pathname.slice(1) || 'dashboard'
  const pageName = routeToLabelMap[currentPath] || ''
  const displayName = employeeProfile?.name || user?.email || '未登录用户'
  const roleLabel = getRoleLabel(role)

  return (
    <Header
      className="flex items-center"
      style={{ padding: 0, background: colorBgContainer }}
    >
      <Button
        type="text"
        icon={
          collapsed ? (
            <Bars3BottomRightIcon className="size-4" />
          ) : (
            <Bars3BottomLeftIcon className="size-4" />
          )
        }
        onClick={onToggleCollapse}
        style={{
          fontSize: 16,
          width: 64,
          height: 64,
        }}
      />
      {pageName && (
        <span className="ml-2 text-base font-semibold text-neutral-900 dark:text-neutral-50">
          {pageName}
        </span>
      )}

      <div className="mr-12 flex h-full flex-1 items-center justify-end gap-4">
        <span className="text-sm text-gray-600 dark:text-gray-300">
          欢迎您：{displayName}
          {roleLabel ? `（${roleLabel}）` : ''}
        </span>
        <DarkModeButton />
        <Button
          type="link"
          onClick={async () => {
            try {
              await signOut()
              navigate('/login', { replace: true })
            } catch {
              // 可以在这里接入全局 message 提示
            }
          }}
        >
          退出登录
        </Button>
      </div>
    </Header>
  )
}
