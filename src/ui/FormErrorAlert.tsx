import { Alert } from 'antd'
import { getUserErrorMessage } from '@/utils/errorHandler'
import ErrorTechnicalDetail from './ErrorTechnicalDetail'

/**
 * 表单错误反馈组件（S3 UI 改版）
 *
 * 规格（docs/UI设计调研与改版指南.md §6.2.4）：
 * "操作失败" → "失败原因 + 影响 + 建议" 三段式结构化反馈。
 *
 * 失败原因自动从 error 提取（getUserErrorMessage：已知错误转中文，未知英文原文
 * 不直接展示，而是放进可展开的「技术详情」），
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

  const reasonText = reason ?? getUserErrorMessage(error, '系统暂时无法完成操作')

  return (
    <Alert
      type="error"
      showIcon
      className={className}
      title="操作失败"
      description={(
        <div className="space-y-1.5 text-sm">
          <p>
            <span className="font-medium">失败原因：</span>
            {reasonText}
          </p>
          <p>
            <span className="font-medium">影响：</span>
            {impact}
          </p>
          <p>
            <span className="font-medium">建议：</span>
            {suggestion}
          </p>
          <ErrorTechnicalDetail error={error} />
        </div>
      )}
    />
  )
}
