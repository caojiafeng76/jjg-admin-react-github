import dayjs from 'dayjs'

import type {
  ToolingFixtureLifecycle,
  ToolingFixtureStatus,
} from '@/features/tooling-fixture/fixtureDomain'
import { TOOLING_FIXTURE_LIFECYCLES } from '@/features/tooling-fixture/fixtureDomain'
import { handleApiError } from '@/utils/errorHandler'
import { buildPostgrestOrIlikeFilter } from '@/utils/postgrestFilters'
import type { Database } from './database.types'
import supabase from './supabase'

type ToolingFixtureRow = Database['public']['Tables']['tooling_fixtures']['Row']

export type ToolingFixture = Omit<ToolingFixtureRow, 'status' | 'lifecycle'> & {
  status: ToolingFixtureStatus
  lifecycle: ToolingFixtureLifecycle
}

export interface ToolingFixtureDateRange {
  start?: string
  end?: string
}

export interface ToolingFixtureFormValues {
  fixture_no: string
  category: string
  applicable_product_drawing_no: string
  product_name: string
  applicable_equipment: string
  storage_location: string
  manufactured_date: string | null
  manufacturer: string
  lifecycle: ToolingFixtureLifecycle
  last_maintenance_date: string | null
  maintenance_cycle_days: number | null
  responsible_person: string
  remarks: string
}

function normalizeText(value: string | null | undefined): string {
  return String(value ?? '').trim()
}

function normalizeDate(
  value: string | null | undefined,
  label: string,
): string | null {
  const normalized = normalizeText(value)

  if (!normalized) {
    return null
  }

  const parsed = dayjs(normalized)

  if (!parsed.isValid()) {
    throw new Error(`${label}格式无效，请使用 YYYY-MM-DD`)
  }

  return parsed.format('YYYY-MM-DD')
}

function parseToolingFixture(row: ToolingFixtureRow): ToolingFixture {
  if (!['未使用', '使用中'].includes(row.status)) {
    throw new Error('工装状态无效，请联系管理员')
  }

  if (!TOOLING_FIXTURE_LIFECYCLES.includes(row.lifecycle as ToolingFixtureLifecycle)) {
    throw new Error('工装寿命状态无效，请联系管理员')
  }

  return {
    ...row,
    status: row.status as ToolingFixtureStatus,
    lifecycle: row.lifecycle as ToolingFixtureLifecycle,
  }
}

export function normalizeToolingFixtureFormValues(
  values: ToolingFixtureFormValues,
): ToolingFixtureFormValues {
  const fixtureNo = normalizeText(values.fixture_no)

  if (!fixtureNo) {
    throw new Error('请输入工装模具编号')
  }

  const cycle =
    values.maintenance_cycle_days === null ||
    values.maintenance_cycle_days === undefined
      ? null
      : Number(values.maintenance_cycle_days)

  if (cycle !== null && (!Number.isInteger(cycle) || cycle <= 0)) {
    throw new Error('保养周期必须是大于 0 的整数天数')
  }

  if (!TOOLING_FIXTURE_LIFECYCLES.includes(values.lifecycle)) {
    throw new Error('工装寿命状态无效，请联系管理员')
  }

  return {
    fixture_no: fixtureNo,
    category: normalizeText(values.category),
    applicable_product_drawing_no: normalizeText(
      values.applicable_product_drawing_no,
    ),
    product_name: normalizeText(values.product_name),
    applicable_equipment: normalizeText(values.applicable_equipment),
    storage_location: normalizeText(values.storage_location),
    manufactured_date: normalizeDate(values.manufactured_date, '制作日期'),
    manufacturer: normalizeText(values.manufacturer),
    lifecycle: values.lifecycle,
    last_maintenance_date: normalizeDate(
      values.last_maintenance_date,
      '上次保养日期',
    ),
    maintenance_cycle_days: cycle,
    responsible_person: normalizeText(values.responsible_person),
    remarks: normalizeText(values.remarks),
  }
}

async function fixtureNoExists(fixtureNo: string, excludeId?: string) {
  let query = supabase
    .from('tooling_fixtures')
    .select('id')
    .eq('fixture_no', fixtureNo)
    .limit(1)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query.range(0, 0)

  if (error) {
    throw handleApiError(error, '检查工装模具编号失败')
  }

  return Array.isArray(data) && data.length > 0
}

const TOOLING_FIXTURE_SEARCH_FIELDS = [
  'fixture_no',
  'category',
  'applicable_product_drawing_no',
  'product_name',
  'applicable_equipment',
  'storage_location',
  'manufacturer',
  'responsible_person',
] as const

const TOOLING_FIXTURE_ALL_LIMIT = 1000

export async function getToolingFixtureList({
  page,
  pageSize,
  keyword,
  status,
  manufacturedDateRange,
  signal,
}: {
  page: number
  pageSize: number
  keyword?: string
  status?: ToolingFixture['status']
  manufacturedDateRange?: ToolingFixtureDateRange
  signal?: AbortSignal
}): Promise<{ items: ToolingFixture[]; total: number }> {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  let query = supabase.from('tooling_fixtures').select('*', { count: 'exact' })
  const normalizedKeyword = normalizeText(keyword)

  if (normalizedKeyword) {
    query = query.or(
      buildPostgrestOrIlikeFilter(
        TOOLING_FIXTURE_SEARCH_FIELDS,
        normalizedKeyword,
      ),
    )
  }

  if (status) {
    query = query.eq('status', status)
  }

  if (manufacturedDateRange?.start) {
    query = query.gte('manufactured_date', manufacturedDateRange.start)
  }

  if (manufacturedDateRange?.end) {
    query = query.lte('manufactured_date', manufacturedDateRange.end)
  }

  query = query
    .order('updated_at', { ascending: false })
    .order('fixture_no', { ascending: true })

  if (signal) {
    query = query.abortSignal(signal)
  }

  const { data, error, count } = await query.range(from, to)

  if (error) {
    throw handleApiError(error, '获取工装资料列表失败')
  }

  return {
    items: (data ?? []).map(parseToolingFixture),
    total: count ?? 0,
  }
}

export async function getAllToolingFixtures({
  keyword,
  status,
  manufacturedDateRange,
  signal,
}: {
  keyword?: string
  status?: ToolingFixture['status']
  manufacturedDateRange?: ToolingFixtureDateRange
  signal?: AbortSignal
}): Promise<ToolingFixture[]> {
  const normalizedKeyword = normalizeText(keyword)
  let query = supabase
    .from('tooling_fixtures')
    .select('*', { count: 'exact' })

  if (normalizedKeyword) {
    query = query.or(
      buildPostgrestOrIlikeFilter(
        TOOLING_FIXTURE_SEARCH_FIELDS,
        normalizedKeyword,
      ),
    )
  }

  if (status) {
    query = query.eq('status', status)
  }

  if (manufacturedDateRange?.start) {
    query = query.gte('manufactured_date', manufacturedDateRange.start)
  }

  if (manufacturedDateRange?.end) {
    query = query.lte('manufactured_date', manufacturedDateRange.end)
  }

  query = query
    .order('updated_at', { ascending: false })
    .order('fixture_no', { ascending: true })

  if (signal) {
    query = query.abortSignal(signal)
  }

  const { data, error, count } = await query.range(
    0,
    TOOLING_FIXTURE_ALL_LIMIT - 1,
  )

  if (error) {
    throw handleApiError(error, '获取工装资料列表失败')
  }

  if ((count ?? 0) > TOOLING_FIXTURE_ALL_LIMIT) {
    throw new Error('筛选结果超过 1000 条，请缩小筛选范围后重试')
  }

  return (data ?? []).map(parseToolingFixture)
}

export async function createToolingFixture(
  values: ToolingFixtureFormValues,
): Promise<void> {
  const payload = normalizeToolingFixtureFormValues(values)

  if (await fixtureNoExists(payload.fixture_no)) {
    throw new Error(`工装模具编号“${payload.fixture_no}”已存在`)
  }

  const { error } = await supabase.from('tooling_fixtures').insert(payload)

  if (error) {
    throw handleApiError(error, '创建工装资料失败')
  }
}

export async function updateToolingFixture({
  id,
  values,
}: {
  id: string
  values: ToolingFixtureFormValues
}): Promise<void> {
  const payload = normalizeToolingFixtureFormValues(values)

  if (await fixtureNoExists(payload.fixture_no, id)) {
    throw new Error(`工装模具编号“${payload.fixture_no}”已存在`)
  }

  const { error } = await supabase
    .from('tooling_fixtures')
    .update(payload)
    .eq('id', id)
    .range(0, 0)

  if (error) {
    throw handleApiError(error, '更新工装资料失败')
  }
}

export async function deleteToolingFixtures(ids: string[]): Promise<void> {
  const normalizedIds = ids.filter(Boolean)

  if (normalizedIds.length === 0) {
    throw new Error('请选择至少一条工装资料')
  }

  const { error } = await supabase
    .from('tooling_fixtures')
    .delete()
    .in('id', normalizedIds)

  if (error) {
    throw handleApiError(error, '删除工装资料失败')
  }
}

export async function createToolingFixturesBatch(
  rows: ToolingFixtureFormValues[],
): Promise<void> {
  if (rows.length === 0) {
    throw new Error('请选择至少一条工装资料')
  }

  const payload = rows.map(normalizeToolingFixtureFormValues)

  const fixtureNoSet = new Set<string>()

  for (const row of payload) {
    if (fixtureNoSet.has(row.fixture_no)) {
      throw new Error(`Excel 中存在重复工装模具编号“${row.fixture_no}”`)
    }

    fixtureNoSet.add(row.fixture_no)
  }

  const fixtureNos = payload.map((row) => row.fixture_no)
  const { data: existingRows, error: existingError } = await supabase
    .from('tooling_fixtures')
    .select('fixture_no')
    .in('fixture_no', fixtureNos)

  if (existingError) {
    throw handleApiError(existingError, '检查工装模具编号是否已存在失败')
  }

  if ((existingRows ?? []).length > 0) {
    const duplicateNos = (existingRows as Array<{ fixture_no: string }>)
      .map((row) => row.fixture_no)
      .join('、')

    throw new Error(`以下工装模具编号已存在，无法导入：${duplicateNos}`)
  }

  const { error } = await supabase.from('tooling_fixtures').insert(payload)

  if (error) {
    throw handleApiError(error, '批量导入工装资料失败')
  }
}
