import { describe, expect, it } from 'vitest'

import {
  applySyneyMaterialsKeyword,
  sanitizeSyneyMaterialsKeyword,
} from './syneyMaterialsSearchFields'

function fakeQuery() {
  const calls: string[] = []
  const query = {
    calls,
    or(filters: string) {
      calls.push(filters)
      return query
    },
  }
  return query
}

describe('西尼材料单关键词搜索', () => {
  it('同时匹配品名或规格', () => {
    const query = fakeQuery()
    applySyneyMaterialsKeyword(query, ' 1575 ')
    expect(query.calls).toEqual([
      'material_name.ilike.%1575%,specification.ilike.%1575%',
    ])
  })

  it('空关键词不加条件', () => {
    const query = fakeQuery()
    applySyneyMaterialsKeyword(query, '   ')
    applySyneyMaterialsKeyword(query, undefined)
    expect(query.calls).toEqual([])
  })

  it('去掉会破坏 or() 语法的逗号和括号', () => {
    expect(sanitizeSyneyMaterialsKeyword('梳齿（扶梯）,(左)')).toBe('梳齿（扶梯）  左')
    const query = fakeQuery()
    applySyneyMaterialsKeyword(query, 'M8,(x)')
    expect(query.calls[0]).toBe('material_name.ilike.%M8  x%,specification.ilike.%M8  x%')
  })
})
