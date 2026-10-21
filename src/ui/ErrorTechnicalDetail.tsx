import { Typography } from 'antd'
import { getErrorTechnicalDetail } from '@/utils/errorHandler'

export interface ErrorTechnicalDetailProps {
  error: unknown
  className?: string
}

/**
 * 可展开的错误技术详情（错误码 / 数据库原文），默认折叠。
 * 用户看到的是中文原因，原文仅在此处展示，便于复制反馈给开发。
 */
export default function ErrorTechnicalDetail({
  error,
  className,
}: ErrorTechnicalDetailProps) {
  const detail = getErrorTechnicalDetail(error)

  if (!detail) {
    return null
  }

  return (
    <details
      className={`text-left text-xs text-slate-500 dark:text-slate-400 ${className ?? ''}`}
    >
      <summary className="cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200">
        技术详情
      </summary>
      <Typography.Paragraph
        copyable={{ text: detail, tooltips: ['复制', '已复制'] }}
        className="mt-1.5! mb-0! rounded-md bg-slate-50 px-2 py-1.5 font-mono text-xs! break-all whitespace-pre-wrap text-slate-600! dark:bg-slate-800 dark:text-slate-300!"
      >
        {detail}
      </Typography.Paragraph>
    </details>
  )
}
