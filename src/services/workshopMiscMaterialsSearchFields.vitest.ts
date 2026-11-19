import { describe, expect, it } from 'vitest'

import {
  applyWorkshopMiscMaterialsKeyword,
  applyWorkshopMiscMaterialsSearchFilters,
  normalizeWorkshopMiscMaterialsSearchFilters,
  readWorkshopMiscMaterialsSearchFilters,
  sanitizeWorkshopMiscMaterialsKeyword,
  writeWorkshopMiscMaterialsSearchFilters,
} from './workshopMiscMaterialsSearchFields'

function fakeQuery() {
  const orCalls: string[] = []
  const ilikeCalls: Array<[string, string]> = []
  const query = {
    orCalls,
    ilikeCalls,
    or(filters: string) {
      orCalls.push(filters)
      return query
    },
    ilike(column: string, pattern: string) {
      ilikeCalls.push([column, pattern])
      return query
    },
  }
  return query
}

describe('车间杂项材料筛选与关键词搜索', () => {
  it('按固定键序归一化并去除空白筛选值', () => {
    expect(
      normalizeWorkshopMiscMaterialsSearchFilters({
        category: ' 五金 ',
        model: ' 196-001 ',
        specification: '   ',
        customerModel: ' C-1 ',
      }),
    ).toEqual({
      model: '196-001',
      customerModel: 'C-1',
      category: '五金',
    })
  })

  it('组合筛选对非空字段追加 ilike 并转义通配符', () => {
    const query = fakeQuery()
    applyWorkshopMiscMaterialsSearchFilters(query, {
      model: '196-100%',
      category: '板_材',
    })
    expect(query.ilikeCalls).toEqual([
      ['model', '%196-100\\%%'],
      ['category', '%板\\_材%'],
    ])
  })

  it('URL 参数读写并清理旧 keyword 与空参数', () => {
    const params = new URLSearchParams('keyword=old&model=196&category=五金')
    expect(readWorkshopMiscMaterialsSearchFilters(params)).toEqual({
      model: '196',
      category: '五金',
    })

    writeWorkshopMiscMaterialsSearchFilters(params, {
      model: ' 267-01 ',
      customerModel: '',
      specification: '2mm',
    })
    expect(params.get('keyword')).toBeNull()
    expect(params.get('model')).toBe('267-01')
    expect(params.get('customerModel')).toBeNull()
    expect(params.get('specification')).toBe('2mm')
    expect(params.get('category')).toBeNull()
  })

  it('单关键词同时匹配型号、客户型号、规格或类别', () => {
    const query = fakeQuery()
    applyWorkshopMiscMaterialsKeyword(query, ' 196 ')
    expect(query.orCalls).toEqual([
      'model.ilike.%196%,customer_model.ilike.%196%,specification.ilike.%196%,category.ilike.%196%',
    ])
  })

  it('空关键词不加条件且去掉会破坏 or() 语法的逗号和括号', () => {
    const emptyQuery = fakeQuery()
    applyWorkshopMiscMaterialsKeyword(emptyQuery, '   ')
    applyWorkshopMiscMaterialsKeyword(emptyQuery, undefined)
    expect(emptyQuery.orCalls).toEqual([])

    expect(sanitizeWorkshopMiscMaterialsKeyword('196,(左)')).toBe('196  左')
    const query = fakeQuery()
    applyWorkshopMiscMaterialsKeyword(query, 'M8,(x)')
    expect(query.orCalls[0]).toBe(
      'model.ilike.%M8  x%,customer_model.ilike.%M8  x%,specification.ilike.%M8  x%,category.ilike.%M8  x%',
    )
  })
})
