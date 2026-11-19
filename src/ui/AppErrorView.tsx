import type { ButtonProps } from 'antd'
import type { ReactNode } from 'react'
import {
  ExclamationTriangleIcon,
  MapIcon,
  ShieldExclamationIcon,
  SignalSlashIcon,
} from '@heroicons/react/24/outline'
import { Button, Space, Typography } from 'antd'

const { Paragraph, Text, Title } = Typography

export interface AppErrorAction {
  key: string
  label: string
  onClick: () => void
  type?: ButtonProps['type']
  icon?: ReactNode
}

export interface AppErrorViewProps {
  variant?: 'generic' | 'network' | 'permission' | 'notFound'
  title: string
  description: string
  detail?: string
  code?: string
  badge?: string
  actions?: AppErrorAction[]
}

const VARIANT_CONFIG = {
  generic: {
    icon: <ExclamationTriangleIcon className="size-6" />,
    accentBar: 'bg-warning',
    iconBox: 'bg-warning/10 text-warning',
    summaryBox: 'border-warning/25 bg-warning/5',
    summaryTitle: 'text-warning',
    headline:
      '当前操作已被系统安全中断。你可以先刷新页面，或回到首页重新进入模块，避免在半加载状态下继续操作。',
    suggestions: [
      '先使用“重新加载”恢复当前页面，如果问题来自网络抖动或会话过期，通常这一步就够了。',
      '如果仍然失败，返回首页后重新进入模块，避免保留失效查询参数或半完成状态。',
      '持续失败时，再把下方诊断信息发给开发人员，用户端无需直接面对原始异常栈。',
    ],
  },
  network: {
    icon: <SignalSlashIcon className="size-6" />,
    accentBar: 'bg-primary',
    iconBox: 'bg-primary/10 text-primary',
    summaryBox: 'border-primary/25 bg-primary/5',
    summaryTitle: 'text-primary',
    headline:
      '系统更像是暂时没有连上数据源，而不是页面本身损坏。优先刷新页面或稍后重试，通常可以自动恢复。',
    suggestions: [
      '确认当前网络正常，尤其是设备切换 Wi‑Fi、蜂窝网络或代理之后。',
      '重新加载页面，让查询请求重新发起，避免继续停留在断连状态。',
      '如果只有个别模块失败，说明后端接口可能暂时波动，可以稍后再试。',
    ],
  },
  permission: {
    icon: <ShieldExclamationIcon className="size-6" />,
    accentBar: 'bg-error',
    iconBox: 'bg-error/10 text-error',
    summaryBox: 'border-error/25 bg-error/5',
    summaryTitle: 'text-error',
    headline:
      '当前页面已经成功打开，但系统拒绝了这次访问或数据读取。这个问题通常需要检查账号角色、员工绑定或数据库权限策略。',
    suggestions: [
      '先确认当前登录账号是否正确，必要时退出并重新登录。',
      '如果你刚调整过角色或员工资料，刷新页面让权限上下文重新加载。',
      '持续出现时，优先排查员工绑定、角色配置和 RLS 策略，而不是前端交互本身。',
    ],
  },
  notFound: {
    icon: <MapIcon className="size-6" />,
    accentBar: 'bg-slate-400 dark:bg-slate-500',
    iconBox: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    summaryBox: 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60',
    summaryTitle: 'text-slate-600 dark:text-slate-300',
    headline:
      '这不是系统崩溃，而是当前地址没有命中有效页面。通常是旧链接失效、手动改了地址，或当前账号没有这个入口。',
    suggestions: [
      '优先从侧边导航重新进入对应模块，不要依赖历史收藏地址。',
      '如果你是从外部链接跳转进来的，确认对方分享的是当前环境可用路径。',
      '如果导航里本来就没有这个入口，那通常不是异常，而是权限或菜单配置问题。',
    ],
  },
} as const

export default function AppErrorView({
  title,
  description,
  detail,
  code,
  badge = '系统提示',
  variant = 'generic',
  actions = [],
}: AppErrorViewProps) {
  const variantConfig = VARIANT_CONFIG[variant]

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 sm:px-6 lg:px-8 dark:bg-slate-950">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className={`h-1 w-full ${variantConfig.accentBar}`} />

        <div className="grid gap-6 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
          <div className="flex flex-col justify-between gap-5">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div
                  className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${variantConfig.iconBox}`}
                >
                  {variantConfig.icon}
                </div>
                <div>
                  <span className="inline-flex items-center rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-medium text-white dark:bg-slate-100 dark:text-slate-900">
                    {badge}
                  </span>
                  <Text className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                    JJG 生产管理系统
                  </Text>
                </div>
              </div>

              <div>
                <Title level={2} className="mb-2! text-slate-900! dark:text-slate-100!">
                  {title}
                </Title>
                <Paragraph className="mb-0! text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {variantConfig.headline}
                </Paragraph>
              </div>

              <div className={`rounded-xl border p-4 ${variantConfig.summaryBox}`}>
                <Text className={`block text-xs font-semibold ${variantConfig.summaryTitle}`}>
                  错误摘要
                </Text>
                <Paragraph className="mt-2! mb-0! text-sm leading-6 text-slate-700 dark:text-slate-200">
                  {description}
                </Paragraph>
              </div>
            </div>

            {actions.length > 0
              ? (
                  <Space wrap size={12}>
                    {actions.map(action => (
                      <Button
                        key={action.key}
                        type={action.type}
                        icon={action.icon}
                        onClick={action.onClick}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </Space>
                )
              : null}
          </div>

          <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700/80 dark:bg-slate-800/50">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                处理建议
              </p>
              <ol className="mt-3 list-decimal space-y-2.5 pl-4 text-sm leading-6 text-slate-700 dark:text-slate-200">
                {variantConfig.suggestions.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </div>

            {detail || code
              ? (
                  <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      诊断信息
                    </p>
                    {code
                      ? (
                          <span className="mt-2 inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                            {code}
                          </span>
                        )
                      : null}
                    {detail
                      ? (
                          <Paragraph className="mt-2! mb-0! font-mono text-xs leading-5 break-all text-slate-600 dark:text-slate-300">
                            {detail}
                          </Paragraph>
                        )
                      : null}
                  </div>
                )
              : (
                  <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      当前状态
                    </p>
                    <Paragraph className="mt-2! mb-0! text-xs leading-5 text-slate-600 dark:text-slate-300">
                      系统已经拦截异常并停止继续渲染，当前不会把不完整数据写入页面。
                    </Paragraph>
                  </div>
                )}
          </div>
        </div>
      </div>
    </div>
  )
}
