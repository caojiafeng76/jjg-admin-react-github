import { Alert } from 'antd'
import { getErrorDisplayInfo } from '@/utils/errorHandler'

/**
 * 表单错误反馈组件（S3 UI 改版）
 *
 * 规格（docs/UI设计调研与改版指南.md §6.2.4）：
 * "操作失败" → "失败原因 + 影响 + 建议" 三段式结构化反馈。
 *
 * 失败原因自动从 error 提取（复用 getErrorDisplayInfo 的英转中映射），
 * 影响 / 建议提供默认文案，页面可按业务覆盖。
 * 通常放在 Modal/Drawer 内表单上方，或页面级表单顶部。
 */

export interface FormErrorAlertProps {
  error: unknown
  /** 失败原因，默认从 error 自动提取 */
  reason?: string
  /** 影响说明，默认「本次操作未生效，已填写的内容不会保存」 */
  impact?: string
  /** 建议，默认「请根据失败原因调整后重试；若问题持续，请联系管理员」 */
  suggestion?: string
  className?: string
}

export default function FormErrorAlert({
  error,
  reason,
  impact = '本次操作未生效，已填写的内容不会保存。',
  suggestion = '请根据失败原因调整后重试；若问题持续，请联系管理员。',
  className,
}: FormErrorAlertProps) {
  if (!error) {
    return null
  }

  const info = getErrorDisplayInfo(error)
  const reasonText = reason ?? info.message

  return (
    <Alert
      type="error"
      showIcon
      className={className}
      message="操作失败"
      description={
        <div className="space-y-1.5 text-sm">
          <p>
            <span className="font-medium">失败原因：</span>
            {reasonText}
            {info.detail ? (
              <span className="text-slate-500 dark:text-slate-400">
                （{info.detail}）
              </span>
            ) : null}
          </p>
          <p>
            <span className="font-medium">影响：</span>
            {impact}
          </p>
          <p>
            <span className="font-medium">建议：</span>
            {suggestion}
          </p>
        </div>
      }
    />
  )
}