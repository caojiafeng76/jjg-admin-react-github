import dayjs from 'dayjs'
import { dashboardChangelog } from './dashboardChangelog'

export default function Dashboard() {
  return (
    <section aria-labelledby="dashboard-changelog-title" className="min-h-0 flex-1 overflow-y-auto">
      <div className="max-w-4xl">
        <h2 id="dashboard-changelog-title" className="text-base font-semibold">
          更新日志
        </h2>
        <ol className="mt-3 divide-y divide-divider border-t border-divider">
          {dashboardChangelog.map(({ date, updates }) => (
            <li key={date} className="grid gap-2 py-4 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4">
              <h3 className="text-sm leading-6 font-semibold text-slate-600 tabular-nums dark:text-slate-300">
                <time dateTime={date}>{dayjs(date).format('YYYY年M月D日')}</time>
              </h3>
              <ul className="list-disc space-y-1 pl-5 text-sm leading-6">
                {updates.map(update => (
                  <li key={update} className="marker:text-text-secondary">{update}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
