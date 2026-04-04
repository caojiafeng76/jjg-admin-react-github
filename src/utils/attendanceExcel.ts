import * as XLSX from 'xlsx-js-style'
import type { AttendanceDetailFormValues } from '@/services/apiAttendanceDetails'

/** 支持的列名映射（兼容不同列名写法） */
const NAME_ALIASES = ['姓名', '员工姓名', '员工名称', '名字', 'Name', 'name']
const DATE_ALIASES = ['日期', '考勤日期', '打卡日期']
const TIME_ALIASES = ['时间', '打卡时间', '考勤时间', '签到时间', '签退时间']
/** ZKTeco 常见合并列：日期和时间在同一列 */
const DATETIME_ALIASES = ['日期时间', '打卡日期时间', '考勤时间', 'DateTime', 'datetime']

/** 将 "2026/3/1 6:59:29" 或 "2026-03-01 08:00" 等格式拆分为 [date, time] */
function splitDateTime(value: string): { date: string; time: string } | null {
  const s = value.trim()
  // 匹配 YYYY/M/D H:mm:ss 或 YYYY-M-D H:mm:ss
  const m = s.match(
    /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/,
  )
  if (m) {
    const date = `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
    const time = `${m[4].padStart(2, '0')}:${m[5]}:${m[6] ?? '00'}`
    return { date, time }
  }
  return null
}

/** 将各种格式的日期值规范为 YYYY-MM-DD */
function normalizeDate(value: unknown): string | null {
  if (value == null || value === '') return null

  if (typeof value === 'number' && value > 1) {
    // Excel 日期序列号（1900 epoch，有 1900-02-29 bug，用 25569 换算为 Unix）
    const utc = (value - 25569) * 86400 * 1000
    const d = new Date(utc)
    const y = d.getUTCFullYear()
    const mo = String(d.getUTCMonth() + 1).padStart(2, '0')
    const day = String(d.getUTCDate()).padStart(2, '0')
    return `${y}-${mo}-${day}`
  }

  if (typeof value === 'string') {
    const s = value.trim()
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
    if (/^\d{4}\/\d{1,2}\/\d{1,2}/.test(s)) {
      const parts = s.slice(0, 10).split('/')
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
    }
    const m = s.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
    if (m)
      return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  }

  if (value instanceof Date) {
    const y = value.getFullYear()
    const mo = String(value.getMonth() + 1).padStart(2, '0')
    const d = String(value.getDate()).padStart(2, '0')
    return `${y}-${mo}-${d}`
  }

  return null
}

/** 将各种格式的时间值规范为 HH:mm:ss */
function normalizeTime(value: unknown): string | null {
  if (value == null || value === '') return null

  // Excel 时间小数（0~1）
  if (typeof value === 'number') {
    const frac = value - Math.floor(value)
    const totalSeconds = Math.round((frac > 0 ? frac : value) * 86400)
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  if (typeof value === 'string') {
    const s = value.trim()
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) {
      const parts = s.split(':')
      return `${parts[0].padStart(2, '0')}:${parts[1]}:${parts[2] ?? '00'}`
    }
  }

  if (value instanceof Date) {
    return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}:${String(value.getSeconds()).padStart(2, '0')}`
  }

  return null
}

function findKey(row: Record<string, unknown>, aliases: string[]): unknown {
  for (const alias of aliases) {
    if (alias in row) return row[alias]
  }
  return undefined
}

/** HH:mm:ss → 秒数 */
function timeToSeconds(time: string): number {
  const parts = time.split(':')
  return (
    parseInt(parts[0], 10) * 3600 +
    parseInt(parts[1], 10) * 60 +
    parseInt(parts[2] ?? '0', 10)
  )
}

/**
 * 去重：同一人同一天，相邻两条时间差 ≤ 10 分钟视为同一次打卡，保留最晚那条。
 */
function deduplicateRows(rows: AttendanceDetailFormValues[]): {
  rows: AttendanceDetailFormValues[]
  removedCount: number
} {
  const THRESHOLD = 10 * 60 // 10 分钟（秒）

  // 按 姓名+日期 分组
  const map = new Map<string, AttendanceDetailFormValues[]>()
  rows.forEach((r) => {
    const key = `${r.name}\x00${r.date}`
    const list = map.get(key)
    if (list) list.push(r)
    else map.set(key, [r])
  })

  const result: AttendanceDetailFormValues[] = []
  let removedCount = 0

  map.forEach((group) => {
    // 组内按时间升序
    group.sort((a, b) => a.time.localeCompare(b.time))

    // 滑动窗口：连续两条差 ≤ 阈值 → 同簇，保留最晚
    let clusterLatest = group[0]
    for (let i = 1; i < group.length; i++) {
      const diff =
        timeToSeconds(group[i].time) - timeToSeconds(clusterLatest.time)
      if (diff <= THRESHOLD) {
        clusterLatest = group[i] // 丢掉更早的，保留更晚的
        removedCount++
      } else {
        result.push(clusterLatest)
        clusterLatest = group[i]
      }
    }
    result.push(clusterLatest)
  })

  return { rows: result, removedCount }
}

export interface AttendanceExcelParseResult {
  rows: AttendanceDetailFormValues[]
  errors: string[]
  removedCount: number
}

export function parseAttendanceExcel(
  file: File,
): Promise<AttendanceExcelParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result as ArrayBuffer
        // codepage 936 = GBK/GB2312，解决 ZKTeco 导出的老 XLS 中文乱码问题
        const workbook = XLSX.read(data, { type: 'array', codepage: 936 })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]

        // 以 header:1 读取原始行，找含"姓名"的标题行（最多扫前 10 行）
        const rawRows = XLSX.utils.sheet_to_json<string[]>(sheet, {
          header: 1,
          defval: '',
        })

        let headerRowIdx = -1
        for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
          const cells = (rawRows[i] as unknown[]).map((c) =>
            String(c ?? '').trim(),
          )
          if (NAME_ALIASES.some((n) => cells.includes(n))) {
            headerRowIdx = i
            break
          }
        }

        if (headerRowIdx === -1) {
          return reject(
            new Error(
              '未找到包含"姓名"列的标题行，请确认 Excel 格式（第一行需有"姓名"列）',
            ),
          )
        }

        const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
          sheet,
          { range: headerRowIdx, defval: '' },
        )

        const rows: AttendanceDetailFormValues[] = []
        const errors: string[] = []

        jsonRows.forEach((row, idx) => {
          const rowNum = headerRowIdx + idx + 2

          const nameRaw = findKey(row, NAME_ALIASES)
          const name = typeof nameRaw === 'string' ? nameRaw.trim() : ''
          if (!name) return // 空行跳过

          // 优先尝试合并列 "日期时间"
          const datetimeRaw = findKey(row, DATETIME_ALIASES)
          if (datetimeRaw != null && datetimeRaw !== '') {
            const parsed = splitDateTime(String(datetimeRaw))
            if (parsed) {
              rows.push({ name, date: parsed.date, time: parsed.time })
              return
            }
            errors.push(
              `第 ${rowNum} 行 ${name}：日期时间格式无法识别（值：${String(datetimeRaw)}）`,
            )
            return
          }

          // 分开的日期 + 时间列
          const dateRaw = findKey(row, DATE_ALIASES)
          const timeRaw = findKey(row, TIME_ALIASES)

          const date = normalizeDate(dateRaw)
          const time = normalizeTime(timeRaw)

          if (!date) {
            errors.push(
              `第 ${rowNum} 行：日期格式无法识别（值：${String(dateRaw)}）`,
            )
            return
          }

          if (!time) {
            errors.push(
              `第 ${rowNum} 行 ${name}：时间格式无法识别（值：${String(timeRaw)}）`,
            )
            return
          }

          rows.push({ name, date, time })
        })

        const deduped = deduplicateRows(rows)
        resolve({ rows: deduped.rows, errors, removedCount: deduped.removedCount })
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Excel 解析失败'))
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsArrayBuffer(file)
  })
}

