import {
  TOOLING_FIXTURE_ACTIONS,
  TOOLING_FIXTURE_STATUSES,
  type ToolingFixtureAction,
  type ToolingFixtureStatus,
} from '@/features/tooling-fixture/fixtureDomain'
import { handleApiError } from '@/utils/errorHandler'
import type { Database, Json } from './database.types'
import publicSupabase from './publicSupabase'
import supabase from './supabase'

export interface PublicToolingFixture {
  id: string
  fixture_no: string
  category: string
  applicable_product_drawing_no: string
  product_name: string
  applicable_equipment: string
  storage_location: string
  manufactured_date: string | null
  manufacturer: string
  status: ToolingFixtureStatus
  last_maintenance_date: string | null
  maintenance_cycle_days: number | null
  responsible_person: string
  remarks: string
}

export interface ToolingFixtureActionResult {
  fixture: Pick<PublicToolingFixture, 'id' | 'fixture_no' | 'status'>
  record: {
    id: string
    action: ToolingFixtureAction
    operator_name: string
    created_at: string
  }
}

export interface ToolingFixtureUsageRecord {
  id: string
  fixture_id: string
  fixture_no: string
  product_name: string
  action: ToolingFixtureAction
  operator_name: string
  created_at: string
}

function normalizeToken(qrToken: string): string {
  const normalizedToken = qrToken.trim()

  if (!normalizedToken) {
    throw new Error('工装二维码令牌不能为空')
  }

  return normalizedToken
}

function parsePublicToolingFixture(
  row: Database['public']['Functions']['get_tooling_fixture_by_qr_token']['Returns'][number],
): PublicToolingFixture {
  if (!TOOLING_FIXTURE_STATUSES.includes(row.status as ToolingFixtureStatus)) {
    throw new Error('工装状态无效，请联系管理员')
  }

  return { ...row, status: row.status as ToolingFixtureStatus }
}

function isJsonRecord(
  value: Json | null,
): value is { [key: string]: Json | undefined } {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseActionResult(
  value:
    | Database['public']['Functions']['record_tooling_fixture_action']['Returns']
    | null,
): ToolingFixtureActionResult {
  if (!isJsonRecord(value)) {
    throw new Error('工装操作返回结果无效')
  }

  const fixture = value.fixture ?? null
  const record = value.record ?? null

  if (!isJsonRecord(fixture) || !isJsonRecord(record)) {
    throw new Error('工装操作返回结果无效')
  }

  const fixtureId = fixture.id
  const fixtureNo = fixture.fixture_no
  const status = fixture.status
  const recordId = record.id
  const action = record.action
  const operatorName = record.operator_name
  const createdAt = record.created_at

  if (
    typeof fixtureId !== 'string' ||
    typeof fixtureNo !== 'string' ||
    typeof status !== 'string' ||
    !TOOLING_FIXTURE_STATUSES.includes(status as ToolingFixtureStatus) ||
    typeof recordId !== 'string' ||
    typeof action !== 'string' ||
    !TOOLING_FIXTURE_ACTIONS.includes(action as ToolingFixtureAction) ||
    typeof operatorName !== 'string' ||
    typeof createdAt !== 'string'
  ) {
    throw new Error('工装操作返回结果无效')
  }

  return {
    fixture: {
      id: fixtureId,
      fixture_no: fixtureNo,
      status: status as ToolingFixtureStatus,
    },
    record: {
      id: recordId,
      action: action as ToolingFixtureAction,
      operator_name: operatorName,
      created_at: createdAt,
    },
  }
}

function parseToolingFixtureAction(action: string): ToolingFixtureAction {
  if (!TOOLING_FIXTURE_ACTIONS.includes(action as ToolingFixtureAction)) {
    throw new Error('工装出入记录动作无效，请联系管理员')
  }

  return action as ToolingFixtureAction
}

export async function getPublicToolingFixture(
  qrToken: string,
): Promise<PublicToolingFixture> {
  const { data, error } = await publicSupabase.rpc(
    'get_tooling_fixture_by_qr_token',
    { target_qr_token: normalizeToken(qrToken) },
  )

  if (error) {
    throw handleApiError(error, '获取工装资料失败')
  }

  const fixture = data?.[0]

  if (!fixture) {
    throw new Error('工装二维码无效或已失效')
  }

  return parsePublicToolingFixture(fixture)
}

export async function recordPublicToolingFixtureAction({
  qrToken,
  action,
  operatorName,
}: {
  qrToken: string
  action: ToolingFixtureAction
  operatorName: string
}): Promise<ToolingFixtureActionResult> {
  const { data, error } = await publicSupabase.rpc(
    'record_tooling_fixture_action',
    {
      target_qr_token: normalizeToken(qrToken),
      target_action: action,
      target_operator_name: operatorName.trim(),
    },
  )

  if (error) {
    throw handleApiError(error, '工装操作失败')
  }

  return parseActionResult(data)
}

type ToolingFixtureSnapshot = Pick<
  Database['public']['Tables']['tooling_fixtures']['Row'],
  'fixture_no' | 'product_name'
>

type UsageRow =
  Database['public']['Tables']['tooling_fixture_usage_records']['Row'] & {
    tooling_fixtures: ToolingFixtureSnapshot | ToolingFixtureSnapshot[] | null
  }

function getFixtureSnapshot(relation: UsageRow['tooling_fixtures']): {
  fixture_no: string
  product_name: string
} {
  const snapshot = Array.isArray(relation) ? relation[0] : relation

  return {
    fixture_no: snapshot?.fixture_no ?? '-',
    product_name: snapshot?.product_name ?? '-',
  }
}

export async function getToolingFixtureUsageRecords({
  page,
  pageSize,
  action,
  signal,
}: {
  page: number
  pageSize: number
  action?: ToolingFixtureAction
  signal?: AbortSignal
}): Promise<{ items: ToolingFixtureUsageRecord[]; total: number }> {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  let query = supabase
    .from('tooling_fixture_usage_records')
    .select(
      'id, fixture_id, action, operator_name, created_at, tooling_fixtures(fixture_no, product_name)',
      { count: 'exact' },
    )

  if (action) {
    query = query.eq('action', action)
  }

  query = query.order('created_at', { ascending: false })

  if (signal) {
    query = query.abortSignal(signal)
  }

  const { data, error, count } = await query.range(from, to)

  if (error) {
    throw handleApiError(error, '获取工装出入记录失败')
  }

  const items = (data ?? []).map((row) => ({
    id: row.id,
    fixture_id: row.fixture_id,
    action: parseToolingFixtureAction(row.action),
    operator_name: row.operator_name,
    created_at: row.created_at,
    ...getFixtureSnapshot(row.tooling_fixtures),
  }))

  return { items: items ?? [], total: count ?? 0 }
}
