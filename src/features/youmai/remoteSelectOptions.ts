import { useCallback, useEffect, useMemo, useState } from 'react'

export interface ProductOptionSnapshot {
  id: string
  material_code: string
  material_name: string
  model: string
  specification: string
  specific_gravity: number
}

interface ProductOptionSnapshotSource {
  product_data_id?: string
  material_code?: string
  material_name?: string
  model?: string
  specification?: string
  specific_gravity?: number
}

export function createProductOptionSnapshot(
  source?: ProductOptionSnapshotSource | null,
): ProductOptionSnapshot | undefined {
  if (
    !source?.product_data_id ||
    typeof source.material_code !== 'string' ||
    typeof source.material_name !== 'string' ||
    typeof source.model !== 'string' ||
    typeof source.specification !== 'string' ||
    typeof source.specific_gravity !== 'number'
  ) {
    return undefined
  }

  return {
    id: source.product_data_id,
    material_code: source.material_code,
    material_name: source.material_name,
    model: source.model,
    specification: source.specification,
    specific_gravity: source.specific_gravity,
  }
}

export function mergeOptionsById<T extends { id: string }>(
  currentOptions: readonly T[],
  snapshots: readonly T[] = [],
): T[] {
  const currentById = new Map<string, T>()

  currentOptions.forEach((option) => {
    currentById.set(option.id, option)
  })

  const mergedOptions = Array.from(currentById.values())

  snapshots.forEach((snapshot) => {
    if (!currentById.has(snapshot.id)) {
      currentById.set(snapshot.id, snapshot)
      mergedOptions.push(snapshot)
    }
  })

  return mergedOptions
}

export function useRemoteSelectOptions<T extends { id: string }>(
  currentOptions: readonly T[],
  initialSnapshot?: T,
) {
  const [selectedSnapshot, setSelectedSnapshot] = useState<T | undefined>(
    initialSnapshot,
  )

  useEffect(() => {
    setSelectedSnapshot(initialSnapshot)
  }, [initialSnapshot])

  useEffect(() => {
    setSelectedSnapshot((snapshot) => {
      if (!snapshot) return snapshot

      return (
        currentOptions.find((option) => option.id === snapshot.id) ?? snapshot
      )
    })
  }, [currentOptions, selectedSnapshot?.id])

  const mergedOptions = useMemo(
    () =>
      mergeOptionsById(
        currentOptions,
        selectedSnapshot ? [selectedSnapshot] : [],
      ),
    [currentOptions, selectedSnapshot],
  )

  const rememberSelectedOption = useCallback(
    (id?: string) => {
      setSelectedSnapshot(
        id ? mergedOptions.find((option) => option.id === id) : undefined,
      )
    },
    [mergedOptions],
  )

  return { mergedOptions, rememberSelectedOption }
}
