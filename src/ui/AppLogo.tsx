import { Squares2X2Icon } from '@heroicons/react/24/outline'

interface AppLogoProps {
  /** Sider 折叠时只显示图标 */
  collapsed?: boolean
}

export default function AppLogo({ collapsed = false }: AppLogoProps) {
  return (
    <div
      className={`mx-3 my-4 rounded-2xl border py-3 ${
        collapsed
          ? 'flex justify-center px-0'
          : 'flex items-center gap-3 px-3'
      } border-slate-200/80 bg-slate-50 dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-sky-500 to-cyan-400 text-white shadow-[0_10px_24px_rgba(14,165,233,0.28)]">
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
