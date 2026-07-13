export interface RemoteToolingOption {
  id: string
  tool_code: string
  tool_name: string
  tool_spec: string
  material: string
  unit_price: number
}

interface ToolingRecordSnapshotSource {
  tooling_data_id: string
  tool_code: string
  tool_name: string
  tool_spec: string
  material: string
  unit_price: number
}

export function createToolingOptionSnapshot(
  value: unknown,
): RemoteToolingOption | undefined {
  if (!value || typeof value !== 'object') {
    return undefined
  }

  const candidate = value as Partial<ToolingRecordSnapshotSource>
  if (
    !candidate.tooling_data_id ||
    typeof candidate.tool_code !== 'string' ||
    typeof candidate.tool_name !== 'string' ||
    typeof candidate.tool_spec !== 'string' ||
    typeof candidate.material !== 'string' ||
    typeof candidate.unit_price !== 'number'
  ) {
    return undefined
  }

  return {
    id: candidate.tooling_data_id,
    tool_code: candidate.tool_code,
    tool_name: candidate.tool_name,
    tool_spec: candidate.tool_spec,
    material: candidate.material,
    unit_price: candidate.unit_price,
  }
}

export function mergeToolingOptions<T extends RemoteToolingOption>(
  remoteOptions: readonly T[],
  selectedSnapshot?: RemoteToolingOption,
): RemoteToolingOption[] {
  const merged = new Map<string, RemoteToolingOption>()

  for (const option of remoteOptions) {
    merged.set(option.id, option)
  }

  if (selectedSnapshot && !merged.has(selectedSnapshot.id)) {
    merged.set(selectedSnapshot.id, selectedSnapshot)
  }

  return [...merged.values()]
}
