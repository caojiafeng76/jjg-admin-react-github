import type {
  PrecisionFinishingCuttingInsert,
  PrecisionFinishingCuttingInsertBase,
  PrecisionFinishingCuttingUpdate,
  PrecisionFinishingCuttingUpdateBase,
  PrecisionFinishingCuttingWithEmployee,
} from './types'
import { handleApiError } from '@/utils/errorHandler'
import {
  normalizePrecisionFinishingCuttingInsertPayload,
  normalizePrecisionFinishingCuttingUpdatePayload,
} from './normalize'
import { getPrecisionFinishingCuttingsQuery } from './queries'

export async function createPrecisionFinishingCutting(
  values: PrecisionFinishingCuttingInsert,
) {
  const payload = normalizePrecisionFinishingCuttingInsertPayload(values)

  const { data, error } = await getPrecisionFinishingCuttingsQuery()
    .insert(payload as PrecisionFinishingCuttingInsertBase)
    .select('*')
    .single()

  if (error) {
    throw handleApiError(error, '创建精加工切割单失败')
  }

  return data as PrecisionFinishingCuttingWithEmployee
}

export async function updatePrecisionFinishingCutting({
  id,
  values,
}: {
  id: string
  values: PrecisionFinishingCuttingUpdate
}) {
  const payload = normalizePrecisionFinishingCuttingUpdatePayload(values)

  const { data, error } = await getPrecisionFinishingCuttingsQuery()
    .update(payload as PrecisionFinishingCuttingUpdateBase)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw handleApiError(error, '更新精加工切割单失败')
  }

  return data as PrecisionFinishingCuttingWithEmployee
}

export async function batchUpdatePrecisionFinishingCuttings({
  ids,
  values,
}: {
  ids: string[]
  values: PrecisionFinishingCuttingUpdate
}) {
  if (ids.length === 0) {
    return [] as PrecisionFinishingCuttingWithEmployee[]
  }

  const payload = normalizePrecisionFinishingCuttingUpdatePayload(values)

  const { data, error } = await getPrecisionFinishingCuttingsQuery()
    .update(payload as PrecisionFinishingCuttingUpdateBase)
    .in('id', ids)
    .select('*')

  if (error) {
    throw handleApiError(error, '批量更新精加工切割单失败')
  }

  return (data || []) as PrecisionFinishingCuttingWithEmployee[]
}

export async function deletePrecisionFinishingCuttings(ids: string[]) {
  const { error } = await getPrecisionFinishingCuttingsQuery()
    .delete()
    .in('id', ids)

  if (error) {
    throw handleApiError(error, '删除精加工切割单失败')
  }
}
