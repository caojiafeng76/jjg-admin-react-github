import type { PackagingEmployeeOption } from '@/services/apiPackagingEmployees'

export interface EmployeeSelectOption {
  label: string
  value: string
}

export function toEmployeeSelectOption(
  employee: Pick<PackagingEmployeeOption, 'id' | 'name'>,
): EmployeeSelectOption {
  return {
    label: employee.name,
    value: employee.id,
  }
}

export function mergeEmployeeSelectOptions(
  employees: readonly Pick<PackagingEmployeeOption, 'id' | 'name'>[],
  snapshots: readonly EmployeeSelectOption[],
  selectedIds: readonly string[],
): EmployeeSelectOption[] {
  const options = employees.map(toEmployeeSelectOption)
  const optionIds = new Set(options.map(({ value }) => value))
  const selectedIdSet = new Set(selectedIds)

  snapshots.forEach((snapshot) => {
    if (!selectedIdSet.has(snapshot.value) || optionIds.has(snapshot.value)) {
      return
    }

    options.push(snapshot)
    optionIds.add(snapshot.value)
  })

  return options
}

export function rememberEmployeeOptions(
  previous: EmployeeSelectOption[],
  candidates: readonly EmployeeSelectOption[],
): EmployeeSelectOption[] {
  if (candidates.length === 0) return previous

  const next = new Map(previous.map((option) => [option.value, option]))
  let changed = false

  candidates.forEach((candidate) => {
    const current = next.get(candidate.value)
    if (current?.label === candidate.label) return

    next.set(candidate.value, candidate)
    changed = true
  })

  return changed ? Array.from(next.values()) : previous
}
