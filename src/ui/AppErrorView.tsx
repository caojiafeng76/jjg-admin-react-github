import {
  CompassOutlined,
  DisconnectOutlined,
  ExclamationCircleOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { Button, Card, Space, Tag, Typography } from 'antd'
import type { ButtonProps } from 'antd'
import type { ReactNode } from 'react'

const { Paragraph, Text, Title } = Typography

export interface AppErrorAction {
  key: string
  label: string
  onClick: () => void
  type?: ButtonProps['type']
  icon?: ReactNode
}

interface AppErrorViewProps {
  variant?: 'generic' | 'network' | 'permission' | 'notFound'
  title: string
  description: string
  detail?: string
  code?: string
  badge?: string
  actions?: AppErrorAction[]
}

export default function AppErrorView({
  title,
  description,
  detail,
  code,
  badge = '系统提示',
  variant = 'generic',
  actions = [],
}: AppErrorViewProps) {
  const variantConfig = {
    generic: {
      icon: <ExclamationCircleOutlined />,
      shell:
        'bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.18),_transparent_28%),linear-gradient(135deg,_#f8fafc_0%,_#fff7ed_45%,_#eff6ff_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.2),_transparent_24%),linear-gradient(135deg,_#020617_0%,_#111827_52%,_#172554_100%)]',
      glowLeft: 'bg-amber-300/35 dark:bg-amber-400/20',
      glowRight: 'bg-sky-300/35 dark:bg-sky-400/20',
      iconBox:
        'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
      summaryBox:
        'border-amber-200/70 bg-amber-50/90 dark:border-amber-500/20 dark:bg-amber-500/8',
      summaryTitle: 'text-amber-700 dark:text-amber-300',
      headline:
        '当前操作已被系统安全中断。你可以先刷新页面，或回到首页重新进入模块，避免在半加载状态下继续操作。',
      suggestions: [
        '先使用“重新加载”恢复当前页面，如果问题来自网络抖动或会话过期，通常这一步就够了。',
        '如果仍然失败，返回首页后重新进入模块，避免保留失效查询参数或半完成状态。',
        '持续失败时，再把下方诊断信息发给开发人员，用户端无需直接面对原始异常栈。',
      ],
      accentCard: 'border-amber-300/35 bg-amber-300/10 text-amber-100',
    },
    network: {
      icon: <DisconnectOutlined />,
      shell:
        'bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.24),_transparent_26%),linear-gradient(135deg,_#f0f9ff_0%,_#eff6ff_42%,_#ecfeff_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.24),_transparent_24%),linear-gradient(135deg,_#082f49_0%,_#0f172a_52%,_#172554_100%)]',
      glowLeft: 'bg-sky-300/35 dark:bg-sky-400/20',
      glowRight: 'bg-cyan-300/35 dark:bg-cyan-400/20',
      iconBox: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
      summaryBox:
        'border-sky-200/80 bg-sky-50/90 dark:border-sky-500/20 dark:bg-sky-500/8',
      summaryTitle: 'text-sky-700 dark:text-sky-300',
      headline:
        '系统更像是暂时没有连上数据源，而不是页面本身损坏。优先刷新页面或稍后重试，通常可以自动恢复。',
      suggestions: [
        '确认当前网络正常，尤其是设备切换 Wi‑Fi、蜂窝网络或代理之后。',
        '重新加载页面，让查询请求重新发起，避免继续停留在断连状态。',
        '如果只有个别模块失败，说明后端接口可能暂时波动，可以稍后再试。',
      ],
      accentCard: 'border-sky-300/35 bg-sky-300/10 text-sky-100',
    },
    permission: {
      icon: <SafetyCertificateOutlined />,
      shell:
        'bg-[radial-gradient(circle_at_top,_rgba(248,113,113,0.16),_transparent_26%),linear-gradient(135deg,_#fff7ed_0%,_#fff1f2_45%,_#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(251,113,133,0.18),_transparent_24%),linear-gradient(135deg,_#1f2937_0%,_#111827_48%,_#3f1d2e_100%)]',
      glowLeft: 'bg-rose-300/35 dark:bg-rose-400/20',
      glowRight: 'bg-orange-300/30 dark:bg-orange-400/15',
      iconBox:
        'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
      summaryBox:
        'border-rose-200/80 bg-rose-50/90 dark:border-rose-500/20 dark:bg-rose-500/8',
      summaryTitle: 'text-rose-700 dark:text-rose-300',
      headline:
        '当前页面已经成功打开，但系统拒绝了这次访问或数据读取。这个问题通常需要检查账号角色、员工绑定或数据库权限策略。',
      suggestions: [
        '先确认当前登录账号是否正确，必要时退出并重新登录。',
        '如果你刚调整过角色或员工资料，刷新页面让权限上下文重新加载。',
        '持续出现时，优先排查员工绑定、角色配置和 RLS 策略，而不是前端交互本身。',
      ],
      accentCard: 'border-rose-300/35 bg-rose-300/10 text-rose-100',
    },
    notFound: {
      icon: <CompassOutlined />,
      shell:
        'bg-[radial-gradient(circle_at_top,_rgba(167,139,250,0.18),_transparent_26%),linear-gradient(135deg,_#faf5ff_0%,_#fdf4ff_40%,_#eef2ff_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.2),_transparent_24%),linear-gradient(135deg,_#1e1b4b_0%,_#111827_50%,_#312e81_100%)]',
      glowLeft: 'bg-violet-300/35 dark:bg-violet-400/20',
      glowRight: 'bg-indigo-300/35 dark:bg-indigo-400/20',
      iconBox:
        'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
      summaryBox:
        'border-violet-200/80 bg-violet-50/90 dark:border-violet-500/20 dark:bg-violet-500/8',
      summaryTitle: 'text-violet-700 dark:text-violet-300',
      headline:
        '这不是系统崩溃，而是当前地址没有命中有效页面。通常是旧链接失效、手动改了地址，或当前账号没有这个入口。',
      suggestions: [
        '优先从侧边导航重新进入对应模块，不要依赖历史收藏地址。',
        '如果你是从外部链接跳转进来的，确认对方分享的是当前环境可用路径。',
        '如果导航里本来就没有这个入口，那通常不是异常，而是权限或菜单配置问题。',
      ],
      accentCard: 'border-violet-300/35 bg-violet-300/10 text-violet-100',
    },
  }[variant]

  return (
    <div
      className={`relative min-h-screen overflow-hidden px-4 py-10 sm:px-6 lg:px-8 ${variantConfig.shell}`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40 dark:opacity-15" />
      <div
        className={`absolute top-12 left-[-96px] h-56 w-56 rounded-full blur-3xl ${variantConfig.glowLeft}`}
      />
      <div
        className={`absolute right-[-72px] bottom-0 h-72 w-72 rounded-full blur-3xl ${variantConfig.glowRight}`}
      />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center justify-center">
        <Card className="w-full overflow-hidden rounded-[32px] border-0 bg-white/82 shadow-[0_32px_90px_rgba(15,23,42,0.16)] backdrop-blur dark:bg-slate-950/75">
          <div
            className={`absolute inset-x-0 top-0 h-1.5 ${
              variant === 'network'
                ? 'bg-[linear-gradient(90deg,#0ea5e9_0%,#06b6d4_45%,#38bdf8_100%)]'
                : variant === 'permission'
                  ? 'bg-[linear-gradient(90deg,#fb7185_0%,#f97316_45%,#f43f5e_100%)]'
                  : variant === 'notFound'
                    ? 'bg-[linear-gradient(90deg,#8b5cf6_0%,#6366f1_45%,#a855f7_100%)]'
                    : 'bg-[linear-gradient(90deg,#f59e0b_0%,#f97316_45%,#0ea5e9_100%)]'
            }`}
          />

          <div className="grid gap-8 p-2 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:p-4">
            <div className="rounded-[28px] bg-white/65 p-6 sm:p-8 dark:bg-white/5">
              <Space direction="vertical" size={20} className="w-full">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl text-[22px] ${variantConfig.iconBox}`}
                  >
                    {variantConfig.icon}
                  </div>
                  <div>
                    <Tag className="m-0 rounded-full border-0 bg-slate-900 px-3 py-1 text-[11px] tracking-[0.28em] text-white dark:bg-white dark:text-slate-900">
                      {badge}
                    </Tag>
                    <Text className="mt-2 block text-xs tracking-[0.24em] text-slate-500 uppercase dark:text-slate-400">
                      Workshop Control Center
                    </Text>
                  </div>
                </div>

                <div>
                  <Title className="!mb-3 !text-3xl !leading-tight !text-slate-900 sm:!text-4xl dark:!text-slate-50">
                    {title}
                  </Title>
                  <Paragraph className="!mb-0 max-w-2xl text-base leading-7 text-slate-600 sm:text-[15px] dark:text-slate-300">
                    {variantConfig.headline}
                  </Paragraph>
                </div>

                <div
                  className={`rounded-[24px] border p-5 ${variantConfig.summaryBox}`}
                >
                  <Text
                    className={`block text-[11px] tracking-[0.3em] uppercase ${variantConfig.summaryTitle}`}
                  >
                    错误摘要
                  </Text>
                  <Paragraph className="!mt-3 !mb-0 text-sm leading-7 text-slate-700 dark:text-slate-200">
                    {description}
                  </Paragraph>
                </div>

                {actions.length > 0 ? (
                  <Space wrap size={12}>
                    {actions.map((action) => (
                      <Button
                        key={action.key}
                        type={action.type}
                        size="large"
                        icon={action.icon}
                        onClick={action.onClick}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </Space>
                ) : null}
              </Space>
            </div>

            <div className="flex flex-col justify-between gap-4 rounded-[28px] border border-slate-200/70 bg-slate-950 p-6 text-slate-100 sm:p-8 dark:border-white/10">
              <div>
                <p className="block text-[11px] tracking-[0.3em] text-slate-400 uppercase">
                  处理建议
                </p>
                <Space
                  direction="vertical"
                  size={14}
                  className="mt-4 flex w-full"
                >
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm leading-7 text-slate-200">
                      {variantConfig.suggestions[0]}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm leading-7 text-slate-200">
                      {variantConfig.suggestions[1]}
                    </p>
                  </div>
                  <div
                    className={`rounded-2xl border border-dashed p-4 ${variantConfig.accentCard}`}
                  >
                    <p className="text-sm leading-7 text-inherit">
                      {variantConfig.suggestions[2]}
                    </p>
                  </div>
                </Space>
              </div>

              {detail || code ? (
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <p className="block text-[11px] tracking-[0.3em] text-slate-400 uppercase">
                    诊断信息
                  </p>
                  {code ? (
                    <Tag className="mt-3 rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-sky-200">
                      {code}
                    </Tag>
                  ) : null}
                  {detail ? (
                    <Paragraph className="!mt-3 !mb-0 font-mono text-xs leading-6 break-all text-slate-300">
                      {detail}
                    </Paragraph>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <p className="block text-[11px] tracking-[0.3em] text-slate-400 uppercase">
                    当前状态
                  </p>
                  <Paragraph className="!mt-3 !mb-0 text-sm leading-7 text-slate-300">
                    系统已经拦截异常并停止继续渲染，当前不会把不完整数据写入页面。
                  </Paragraph>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
