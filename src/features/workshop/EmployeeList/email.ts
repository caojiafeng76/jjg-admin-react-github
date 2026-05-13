import type { Employee } from '@/services/apiEmployees'
import { EMPLOYEE_AUTH_EMAIL_DOMAIN } from './constants'

async function getPinyin() {
  const { pinyin } = await import('pinyin-pro')
  return pinyin
}

function buildEmployeeEmailLocalPart(name: string): Promise<string> {
  return getPinyin().then((pinyin) => {
    const normalized = pinyin(name.trim(), {
      toneType: 'none',
      type: 'array',
    })
      .join('')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')

    return normalized || 'yuangong'
  })
}

export async function buildBatchEmployeeAuthEmails(employees: Employee[]) {
  const counters = new Map<string, number>()

  const results = await Promise.all(
    employees.map(async (employee) => {
      const baseLocalPart = await buildEmployeeEmailLocalPart(employee.name)
      return { employee, baseLocalPart }
    }),
  )

  return results.map(({ employee, baseLocalPart }) => {
    const count = (counters.get(baseLocalPart) || 0) + 1
    counters.set(baseLocalPart, count)

    const localPart = count === 1 ? baseLocalPart : `${baseLocalPart}${count}`

    return {
      employee,
      email: `${localPart}@${EMPLOYEE_AUTH_EMAIL_DOMAIN}`,
    }
  })
}