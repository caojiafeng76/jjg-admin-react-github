import { Squares2X2Icon } from '@heroicons/react/24/outline'

export default function AppLogo() {
  return (
    <div className="mx-3 my-4 rounded-2xl border border-slate-700/60 bg-slate-900/70 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-sky-500 to-cyan-400 text-white shadow-[0_10px_24px_rgba(14,165,233,0.28)]">
          <Squares2X2Icon className="size-5" strokeWidth={2.2} />
        </div>

        <div className="min-w-0">
          <div className="text-[10px] font-medium tracking-[0.24em] text-slate-400 uppercase">
            JJG
          </div>
          <div className="truncate text-sm font-semibold tracking-[0.04em] text-slate-100">
            生产管理系统
          </div>
        </div>
      </div>
    </div>
  )
}
