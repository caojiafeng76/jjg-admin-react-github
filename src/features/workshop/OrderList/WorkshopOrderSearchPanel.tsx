import type { ComponentProps } from 'react'

import WorkshopOrderSearch from './WorkshopOrderSearch'

export type WorkshopOrderSearchPanelProps = ComponentProps<
  typeof WorkshopOrderSearch
>

export default function WorkshopOrderSearchPanel({
  onSearch,
  onReset,
  lengthOptions,
}: WorkshopOrderSearchPanelProps) {
  return (
    <div className="rounded-lg border border-slate-200/60 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/80">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-linear-to-br from-slate-100 to-slate-200 shadow-sm dark:from-slate-700 dark:to-slate-800">
            <svg
              className="size-4 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            筛选条件
          </span>
        </div>
        <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />
        <div className="flex-1">
          <WorkshopOrderSearch
            onSearch={onSearch}
            onReset={onReset}
            lengthOptions={lengthOptions}
          />
        </div>
      </div>
    </div>
  )
}
