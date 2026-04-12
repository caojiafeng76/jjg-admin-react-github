import { Layout, Button, theme } from 'antd'
import {
  ArrowRightStartOnRectangleIcon,
  ArrowsRightLeftIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  DocumentChartBarIcon,
  KeyIcon,
  ScissorsIcon,
} from '@heroicons/react/24/outline'
import { BiScan } from 'react-icons/bi'
import { useMemo } from 'react'
import type { ElementType } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '@/contexts/useAuth'

const { Content } = Layout

type NavItem = {
  key: string
  label: string
  icon: ElementType
}

const baseNavItems: NavItem[] = [
  {
    key: '/scan',
    label: '扫码',
    icon: BiScan,
  },
  {
    key: '/production-order',
    label: '我的工单',
    icon: ClipboardDocumentListIcon,
  },
  {
    key: '/production-daily-report',
    label: '我的日报',
    icon: DocumentChartBarIcon,
  },
  {
    key: '/material-transfer',
    label: '转移表',
    icon: ArrowsRightLeftIcon,
  },
  {
    key: '/precision-finishing-cutting',
    label: '精加工',
    icon: ScissorsIcon,
  },
]

export default function EmployeeMobileLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut, user, employeeProfile, role } = useAuth()
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  const navItems = useMemo(() => {
    if (role === 'team_leader') {
      return [
        ...baseNavItems,
        {
          key: '/standard-time-list',
          label: '理论工时',
          icon: ClockIcon,
        },
      ]
    }

    return baseNavItems
  }, [role])

  return (
    <Layout className="h-dvh overflow-hidden bg-[radial-gradient(circle_at_top,#f5f7ff_0%,#eef2ff_35%,#e8edf5_100%)]">
      <header className="sticky top-0 z-20 border-b border-white/50 bg-white/85 px-4 pt-[calc(env(safe-area-inset-top)+14px)] pb-3 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-medium tracking-[0.24em] text-slate-400 uppercase">
              Employee Workspace
            </div>
            <div className="mt-1 text-xl font-black tracking-tight text-slate-900">
              {employeeProfile?.name || user?.email || '员工端'}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Button
              type="text"
              className="rounded-full border border-slate-200/80 bg-white/90 px-3"
              icon={<KeyIcon className="size-4" />}
              onClick={() => navigate('/employee/change-password')}
            >
              修改密码
            </Button>

            <Button
              type="text"
              className="rounded-full border border-slate-200/80 bg-white/90 px-3"
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

      <Content className="min-h-0 overflow-hidden px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+84px)]">
        <div
          className="h-full min-h-0 overflow-hidden rounded-4xl border border-white/60 shadow-[0_20px_70px_rgba(15,23,42,0.08)]"
          style={{ background: colorBgContainer }}
        >
          <Outlet />
        </div>
      </Content>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/60 bg-white/92 px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+10px)] backdrop-blur-xl">
        <div
          className="grid gap-3"
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
                title={item.label}
                className={
                  isActive
                    ? 'flex items-center justify-center rounded-2xl bg-slate-900 px-2 py-3 text-white shadow-[0_10px_30px_rgba(15,23,42,0.25)] transition'
                    : 'flex items-center justify-center rounded-2xl bg-slate-100 px-2 py-3 text-slate-600 transition'
                }
              >
                <Icon className="size-6" />
              </button>
            )
          })}
        </div>
      </nav>

    </Layout>
  )
}
