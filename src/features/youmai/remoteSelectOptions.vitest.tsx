import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  createProductOptionSnapshot,
  mergeOptionsById,
  useRemoteSelectOptions,
} from './remoteSelectOptions'

interface TestOption {
  id: string
  label: string
  version: number
}

const optionA: TestOption = { id: 'a', label: 'A', version: 1 }
const optionB: TestOption = { id: 'b', label: 'B', version: 1 }

describe('remote select option snapshots', () => {
  it('deduplicates by id while preferring the current service object', () => {
    const staleA = { ...optionA, version: 0 }

    expect(mergeOptionsById([optionA, optionB], [staleA])).toEqual([
      optionA,
      optionB,
    ])
  })

  it('keeps a selected full object when a later search no longer returns it', () => {
    const { result, rerender } = renderHook(
      ({ options }: { options: TestOption[] }) =>
        useRemoteSelectOptions(options),
      { initialProps: { options: [optionA, optionB] } },
    )

    act(() => result.current.rememberSelectedOption('a'))
    rerender({ options: [optionB] })

    expect(result.current.mergedOptions).toEqual([optionB, optionA])
  })

  it('refreshes the selected snapshot from current service data', async () => {
    const staleA = { ...optionA, version: 0 }
    const freshA = { ...optionA, version: 2 }
    const { result, rerender } = renderHook(
      ({ options }: { options: TestOption[] }) =>
        useRemoteSelectOptions(options),
      { initialProps: { options: [staleA] } },
    )

    act(() => result.current.rememberSelectedOption('a'))
    await act(async () => {
      rerender({ options: [freshA] })
    })
    rerender({ options: [optionB] })

    expect(result.current.mergedOptions).toEqual([optionB, freshA])
  })

  it('includes an edit snapshot until fresh service data is available', () => {
    const staleA = { ...optionA, version: 0 }
    const { result, rerender } = renderHook(
      ({ options }: { options: TestOption[] }) =>
        useRemoteSelectOptions(options, staleA),
      { initialProps: { options: [] as TestOption[] } },
    )

    expect(result.current.mergedOptions).toEqual([staleA])

    rerender({ options: [optionA] })
    expect(result.current.mergedOptions).toEqual([optionA])
  })

  it('builds a complete product option snapshot from an editable record', () => {
    expect(
      createProductOptionSnapshot({
        product_data_id: 'product-1',
        material_code: 'YM-001',
        material_name: '优迈踏板',
        model: 'M1',
        specification: '1000mm',
        specific_gravity: 1.25,
      }),
    ).toEqual({
      id: 'product-1',
      material_code: 'YM-001',
      material_name: '优迈踏板',
      model: 'M1',
      specification: '1000mm',
      specific_gravity: 1.25,
    })

    expect(
      createProductOptionSnapshot({ product_data_id: 'product-1' }),
    ).toBeUndefined()
  })
})
