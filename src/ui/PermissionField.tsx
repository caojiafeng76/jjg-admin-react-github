import type { ReactNode } from 'react'
import { cloneElement, isValidElement } from 'react'
import type { ReactElement } from 'react'
import { Form } from 'antd'
import type { FormItemProps } from 'antd'
import { useFieldPermission } from '@/hooks/usePermission'

interface PermissionFieldProps extends FormItemProps {
  /** 模块名，用于构造 `field:{module}:{fieldName}` 权限 key */
  module: string
  /** 字段名 */
  fieldName: string
  children: ReactNode
}

/**
 * 带权限三态的 Form.Item 封装：
 * - `hidden`：不渲染此字段
 * - `readonly`：渲染为禁用状态（disabled）
 * - `editable`：正常渲染
 *
 * 注意：若未配置对应 field 权限，因权限 key 在 permissions 表中不存在，
 * can() 返回 false，将默认降级为 hidden。业务中若需开放 field 权限，
 * 应先在 permissions 表中添加对应记录。
 */
export default function PermissionField({
  module,
  fieldName,
  children,
  ...formItemProps
}: PermissionFieldProps) {
  const state = useFieldPermission(module, fieldName)

  if (state === 'hidden') return null

  if (state === 'readonly') {
    return (
      <Form.Item {...formItemProps}>
        {isValidElement(children)
          ? cloneElement(children as ReactElement<{ disabled?: boolean }>, {
              disabled: true,
            })
          : children}
      </Form.Item>
    )
  }

  return <Form.Item {...formItemProps}>{children}</Form.Item>
}
