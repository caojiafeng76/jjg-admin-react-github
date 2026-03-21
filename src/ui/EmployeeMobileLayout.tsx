import { Layout, Button, theme } from 'antd'
import {
  ArrowRightStartOnRectangleIcon,
  ClipboardDocumentListIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '@/contexts/AuthContext'

const { Content } = Layout

const navItems = [
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
]

export default function EmployeeMobileLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut, user, employeeProfile } = useAuth()
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  return (
    <Layout className="min-h-screen bg-[radial-gradient(circle_at_top,_#f5f7ff_0%,_#eef2ff_35%,_#e8edf5_100%)]">
      <header className="sticky top-0 z-20 border-b border-white/50 bg-white/85 px-4 pt-[calc(env(safe-area-inset-top)+14px)] pb-3 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-medium tracking-[0.24em] text-slate-400 uppercase">
              Employee Workspace
            </div>
            <div className="mt-1 text-xl font-black tracking-tight text-slate-900">
              {employeeProfile?.name || user?.email || '员工端'}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              手机端工单录入与日报查询
            </div>
          </div>

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
      </header>

      <Content className="px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+84px)]">
        <div
          className="min-h-[calc(100vh-168px)] rounded-[2rem] border border-white/60 shadow-[0_20px_70px_rgba(15,23,42,0.08)]"
          style={{ background: colorBgContainer }}
        >
          <Outlet />
        </div>
      </Content>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/60 bg-white/92 px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+10px)] backdrop-blur-xl">
        <div className="grid grid-cols-2 gap-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.key
            const Icon = item.icon

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate(item.key)}
                className={
                  isActive
                    ? 'flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(15,23,42,0.25)] transition'
                    : 'flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-600 transition'
                }
              >
                <Icon className="size-4" />
                {item.label}
              </button>
            )
          })}
        </div>
      </nav>
    </Layout>
  )
}
