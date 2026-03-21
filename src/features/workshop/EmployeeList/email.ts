import { pinyin } from 'pinyin-pro'

import type { Employee } from '@/services/apiEmployees'
import { EMPLOYEE_AUTH_EMAIL_DOMAIN } from './constants'

function buildEmployeeEmailLocalPart(name: string): string {
  const normalized = pinyin(name.trim(), {
    toneType: 'none',
    type: 'array',
  })
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

  return normalized || 'yuangong'
}

export function buildBatchEmployeeAuthEmails(employees: Employee[]) {
  const counters = new Map<string, number>()

  return employees.map((employee) => {
    const baseLocalPart = buildEmployeeEmailLocalPart(employee.name)
    const count = (counters.get(baseLocalPart) || 0) + 1

    counters.set(baseLocalPart, count)

    const localPart = count === 1 ? baseLocalPart : `${baseLocalPart}${count}`

    return {
      employee,
      email: `${localPart}@${EMPLOYEE_AUTH_EMAIL_DOMAIN}`,
    }
  })
}