import {
  Bars3BottomLeftIcon,
  Bars3BottomRightIcon,
} from '@heroicons/react/16/solid'
import { Button } from 'antd'
import { Header } from 'antd/es/layout/layout'
import { useLocation } from 'react-router-dom'

import DarkModeButton from '@ui/DarkModeButton'
import { useAppStore } from '@/store'

// 路由到页面名称的映射
const routeToLabelMap: Record<string, string> = {
  dashboard: '首页',
  'syney-po-list': '订单列表',
  'syney-store-report-list': '入库单列表',
  'syney-spec-list': '踏板规格列表',
  'syney-setting': '编号设置',
  'workshop-order-list': '订单管理',
  'workshop-process-list': '工序管理',
  'workshop-defect-reason-list': '不良原因管理',
  'employee-list': '员工管理',
  'production-record-list': '产量录入&统计',
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
  const { isDarkMode } = useAppStore()
  const currentPath = location.pathname.slice(1) || 'dashboard'
  const pageName = routeToLabelMap[currentPath] || ''

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
        <span
          className="ml-2 text-base"
          style={{
            fontWeight: 600,
            color: isDarkMode ? '#ffffff' : '#000000',
          }}
        >
          {pageName}
        </span>
      )}

      <div className="mr-12 flex h-full flex-1 items-center justify-end">
        <DarkModeButton />
      </div>
    </Header>
  )
}
