import type { ElementType } from 'react'
import {
  ArrowRightStartOnRectangleIcon,
  KeyIcon,
} from '@heroicons/react/16/solid'
import {
  ArrowsRightLeftIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  DocumentChartBarIcon,
  ScissorsIcon,
  ViewfinderCircleIcon,
} from '@heroicons/react/24/outline'
import DarkModeButton from '@ui/DarkModeButton'
import { Button, Layout } from 'antd'
import { useMemo } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import { useAuth, usePermissionContext } from '@/contexts'

const { Content } = Layout

interface MobileNavItemDef {
  key: string
  label: string
  icon: ElementType
  /** 对应 nav:mobile-* 权限 key；无此字段时默认显示 */
  permission?: string
}

const allMobileNavItems: MobileNavItemDef[] = [
  {
    key: '/scan',
    label: '扫码',
    icon: ViewfinderCircleIcon,
    permission: 'nav:mobile-scan',
  },
  {
    key: '/production-order',
    label: '我的工单',
    icon: ClipboardDocumentListIcon,
    permission: 'nav:mobile-workspace',
  },
  {
    key: '/production-daily-report',
    label: '我的日报',
    icon: DocumentChartBarIcon,
    permission: 'nav:mobile-daily-report',
  },
  {
    key: '/material-transfer',
    label: '转移表',
    icon: ArrowsRightLeftIcon,
    // 无独立 nav:mobile-* 权限，所有移动端用户均可见
  },
  {
    key: '/precision-finishing-cutting',
    label: '精加工',
    icon: ScissorsIcon,
    // 无独立 nav:mobile-* 权限，所有移动端用户均可见
  },
  {
    key: '/standard-time-list',
    label: '理论工时',
    icon: ClockIcon,
    permission: 'nav:standard-time-list',
  },
]

export default function EmployeeMobileLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut, user, employeeProfile } = useAuth()
  const { can, isLoading } = usePermissionContext()

  const navItems = useMemo(() => {
    if (isLoading)
      return []
    return allMobileNavItems.filter(
      item => !item.permission || can(item.permission),
    )
  }, [can, isLoading])

  return (
    <Layout className="h-dvh overflow-hidden bg-slate-100 dark:bg-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 pt-[calc(env(safe-area-inset-top)+10px)] pb-2.5 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-medium tracking-[0.2em] text-slate-400 uppercase dark:text-slate-500">
              工作台
            </div>
            <div className="mt-0.5 truncate text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {employeeProfile?.name || user?.email || '员工端'}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <DarkModeButton />
            <Button
              type="text"
              size="small"
              icon={<KeyIcon className="size-4" />}
              onClick={() => navigate('/employee/change-password')}
            >
              改密
            </Button>
            <Button
              type="text"
              size="small"
              icon={<ArrowRightStartOnRectangleIcon className="size-4" />}
              onClick={async () => {
                await signOut()
                navigate('/login', { replace: true })
              }}
            >
              退出
            </Button>
          </div>
        </div>
      </header>

      <Content className="min-h-0 overflow-hidden px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+74px)]">
        <div className="h-full min-h-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Outlet />
        </div>
      </Content>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+8px)] backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
        <div
          className="grid gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))`,
          }}
        >
          {navItems.map((item) => {
            const isActive = location.pathname === item.key
            const Icon = item.icon

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate(item.key)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                title={item.label}
                className={
                  isActive
                    ? 'flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl bg-primary/10 px-1 py-1.5 text-primary transition'
                    : 'flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }
              >
                <Icon className="size-5 shrink-0" />
                <span className="text-[11px] leading-tight font-medium whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </Layout>
  )
}
