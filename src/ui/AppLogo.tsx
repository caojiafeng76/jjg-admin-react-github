import { Squares2X2Icon } from '@heroicons/react/24/outline'

interface AppLogoProps {
  /** Sider 折叠时只显示图标 */
  collapsed?: boolean
}

export default function AppLogo({ collapsed = false }: AppLogoProps) {
  return (
    <div
      className={`mx-3 my-4 rounded-xl border py-2.5 ${
        collapsed
          ? 'flex justify-center px-0'
          : 'flex items-center gap-3 px-3'
      } border-slate-200/80 bg-slate-50 dark:border-slate-700/70 dark:bg-slate-800/60`}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
        <Squares2X2Icon className="size-5" strokeWidth={2.2} />
      </div>

      {!collapsed && (
        <div className="min-w-0">
          <div className="text-[10px] font-medium tracking-[0.24em] text-slate-500 uppercase dark:text-slate-400">
            JJG
          </div>
          <div className="truncate text-sm font-semibold tracking-[0.04em] text-slate-900 dark:text-slate-100">
            生产管理系统
          </div>
        </div>
      )}
    </div>
  )
}
