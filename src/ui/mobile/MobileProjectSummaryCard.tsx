import { Alert, Card, Typography } from 'antd'

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
    <Card className="rounded-4xl border-slate-200 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <Title level={5}>{title}</Title>
      {project ? (
        <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <div className="text-xs text-slate-400">项目号</div>
            <div className="mt-1 font-semibold text-slate-900">
              {formatDisplayValue(project.project_no)}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <div className="text-xs text-slate-400">客户</div>
            <div className="mt-1 font-semibold text-slate-900">
              {formatDisplayValue(project.customer)}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <div className="text-xs text-slate-400">型号</div>
            <div className="mt-1 font-semibold text-slate-900">
              {formatDisplayValue(project.product_model)}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <div className="text-xs text-slate-400">长度(mm)</div>
            <div className="mt-1 font-semibold text-slate-900">
              {formatDisplayValue(project.length_mm)}
            </div>
          </div>
          <div className="col-span-2 rounded-2xl bg-slate-50 px-4 py-3">
            <div className="text-xs text-slate-400">客户型号</div>
            <div className="mt-1 font-semibold text-slate-900">
              {formatDisplayValue(project.customer_model)}
            </div>
          </div>
        </div>
      ) : (
        <Alert
          type="info"
          showIcon
          message={emptyMessage}
          description={emptyDescription}
        />
      )}
    </Card>
  )
}
