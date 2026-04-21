export type PermissionScope = 'nav' | 'page' | 'feature' | 'field'

export type PermissionSurface = 'pc' | 'mobile' | 'both'

export type FieldPermissionState = 'hidden' | 'readonly' | 'editable'

export interface PermissionDefinition {
  key: string
  scope: PermissionScope
  module: string
  surface: PermissionSurface
  label: string
  description?: string
}

/** key → enabled */
export type PermissionMap = Record<string, boolean>
