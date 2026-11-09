import { describe, expect, it, vi } from 'vitest'
import {
  applyJintanSearchFilters,
  JINTAN_MATERIALS_SEARCH_FIELDS,
  JINTAN_PARTS_SEARCH_FIELDS,
  JINTAN_PROFILES_SEARCH_FIELDS,
  normalizeJintanSearchFilters,
  readJintanSearchFilters,
  writeJintanSearchFilters,
} from './jintanSearchFields'

function createQuery() {
  const query = {
    ilike: vi.fn((_column: string, _pattern: string) => query),
  }
  return query
}

describe('金檀多字段筛选', () => {
  it('每个非空字段追加一个 ilike 条件，空值跳过', () => {
    const query = createQuery()
    applyJintanSearchFilters(
      query,
      { name: ' 螺丝 ', specification: 'M8', color: '  ', supplier: undefined },
      JINTAN_PARTS_SEARCH_FIELDS,
    )
    expect(query.ilike.mock.calls).toEqual([
      ['part_name', '%螺丝%'],
      ['specification', '%M8%'],
    ])
  })

  it('按域映射到各自的数据库列，忽略不属于该域的字段', () => {
    const profiles = createQuery()
    applyJintanSearchFilters(
      profiles,
      { model: 'X1', name: '边框', supplier: '某厂' },
      JINTAN_PROFILES_SEARCH_FIELDS,
    )
    expect(profiles.ilike.mock.calls).toEqual([
      ['profile_model', '%X1%'],
      ['profile_name', '%边框%'],
    ])

    const materials = createQuery()
    applyJintanSearchFilters(
      materials,
      { model: 'M', color: '黑色', material: '松木' },
      JINTAN_MATERIALS_SEARCH_FIELDS,
    )
    expect(materials.ilike.mock.calls).toEqual([
      ['material_model', '%M%'],
      ['material', '%松木%'],
    ])
  })

  it('转义 LIKE 通配符，按字面匹配', () => {
    const query = createQuery()
    applyJintanSearchFilters(
      query,
      { specification: '50%_a\\b' },
      JINTAN_PARTS_SEARCH_FIELDS,
    )
    expect(query.ilike).toHaveBeenCalledWith(
      'specification',
      '%50\\%\\_a\\\\b%',
    )
  })

  it('URL 读写往返，并清理旧的 keyword 参数', () => {
    const params = new URLSearchParams('page=1&keyword=old&color=红&itemType=A')
    writeJintanSearchFilters(
      params,
      { name: ' 螺丝 ', specification: '' },
      JINTAN_PARTS_SEARCH_FIELDS,
    )
    expect(params.get('keyword')).toBeNull()
    expect(params.get('color')).toBeNull()
    expect(params.get('itemType')).toBe('A')
    expect(readJintanSearchFilters(params, JINTAN_PARTS_SEARCH_FIELDS)).toEqual({
      name: '螺丝',
    })
  })

  it('归一化后键序稳定、去掉空值', () => {
    expect(
      normalizeJintanSearchFilters({ color: ' 红 ', name: 'a', material: ' ' }),
    ).toEqual({ name: 'a', color: '红' })
    expect(
      Object.keys(normalizeJintanSearchFilters({ color: '红', model: 'x' })),
    ).toEqual(['model', 'color'])
    expect(normalizeJintanSearchFilters()).toEqual({})
  })
})
