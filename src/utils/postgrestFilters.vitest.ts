import { describe, expect, it } from 'vitest'

import { buildPostgrestOrIlikeFilter } from './postgrestFilters'

describe('buildPostgrestOrIlikeFilter', () => {
  it('keeps ordinary Chinese keywords as a quoted contains pattern', () => {
    expect(buildPostgrestOrIlikeFilter(['username', 'name'], '张三')).toBe(
      'username.ilike."%张三%",name.ilike."%张三%"',
    )
  })

  it('quotes PostgREST delimiters and escapes quotes and backslashes', () => {
    expect(
      buildPostgrestOrIlikeFilter(['tool_code', 'tool_name'], 'A,B(")\\C'),
    ).toBe(
      String.raw`tool_code.ilike."%A,B(\")\\\\C%",tool_name.ilike."%A,B(\")\\\\C%"`,
    )
  })

  it('treats percent and underscore as literal LIKE characters', () => {
    expect(buildPostgrestOrIlikeFilter(['model'], '50%_')).toBe(
      String.raw`model.ilike."%50\\%\\_%"`,
    )
  })
})
