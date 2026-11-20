import { Alert, Typography } from 'antd'

const { Title } = Typography

interface ProjectSummary {
  project_no: string
  customer?: string | null
  product_model?: string | null
  length_mm?: number | null
  customer_model?: string | null
}

interface Props {
  project?: ProjectSummary
  emptyMessage?: string
  emptyDescription?: string
  title?: string
}

function formatDisplayValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '未识别'
  }

  return String(value)
}

export default function MobileProjectSummaryCard({
  project,
  emptyMessage = '尚未识别项目号',
  emptyDescription = '可先扫码或手动选择项目号。',
  title = '当前识别结果',
}: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <Title level={5} className="mb-3! text-slate-900! dark:text-slate-100!">
        {title}
      </Title>
      {project
        ? (
            <div className="grid grid-cols-2 gap-2.5 text-sm text-slate-600 dark:text-slate-300">
              <div className="rounded-xl bg-slate-50 px-3.5 py-2.5 dark:bg-slate-800/60">
                <div className="text-xs text-slate-400 dark:text-slate-500">项目号</div>
                <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                  {formatDisplayValue(project.project_no)}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 px-3.5 py-2.5 dark:bg-slate-800/60">
                <div className="text-xs text-slate-400 dark:text-slate-500">客户</div>
                <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                  {formatDisplayValue(project.customer)}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 px-3.5 py-2.5 dark:bg-slate-800/60">
                <div className="text-xs text-slate-400 dark:text-slate-500">型号</div>
                <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                  {formatDisplayValue(project.product_model)}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 px-3.5 py-2.5 dark:bg-slate-800/60">
                <div className="text-xs text-slate-400 dark:text-slate-500">长度(mm)</div>
                <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                  {formatDisplayValue(project.length_mm)}
                </div>
              </div>
              <div className="col-span-2 rounded-xl bg-slate-50 px-3.5 py-2.5 dark:bg-slate-800/60">
                <div className="text-xs text-slate-400 dark:text-slate-500">客户型号</div>
                <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                  {formatDisplayValue(project.customer_model)}
                </div>
              </div>
            </div>
          )
        : (
            <Alert
              type="info"
              showIcon
              title={emptyMessage}
              description={emptyDescription}
            />
          )}
    </section>
  )
}
