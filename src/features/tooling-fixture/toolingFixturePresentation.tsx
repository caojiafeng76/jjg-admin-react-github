import type { StatusTone } from '@/ui/StatusPill'
import type { ToolingFixture } from '@/services/apiToolingFixture'

export function assertNever(value: never): never {
  throw new Error(`Unexpected fixture value: ${String(value)}`)
}

export function getStatusTone(status: ToolingFixture['status']): StatusTone {
  switch (status) {
    case '未使用':
      return 'success'
    case '使用中':
      return 'warning'
    default:
      return assertNever(status)
  }
}

export function getLifecycleTone(
  lifecycle: ToolingFixture['lifecycle'],
): StatusTone {
  switch (lifecycle) {
    case '正常':
      return 'success'
    case '维修':
      return 'warning'
    case '报废':
      return 'danger'
    default:
      return assertNever(lifecycle)
  }
}

export function formatDateOnly(value: string | null): string {
  return value ? value.slice(0, 10) : '-'
}
