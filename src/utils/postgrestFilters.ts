function escapeLikeLiteral(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`)
}

function quotePostgrestValue(value: string): string {
  return `"${value.replace(/[\\"]/g, (character) => `\\${character}`)}"`
}

/**
 * Builds a raw PostgREST `or` expression for literal substring searches.
 *
 * PostgREST logical expressions use commas and parentheses as delimiters, so
 * the pattern is always quoted. Backslashes are escaped once for PostgreSQL's
 * LIKE pattern and again for PostgREST's quoted-value grammar.
 */
export function buildPostgrestOrIlikeFilter(
  columns: readonly string[],
  keyword: string,
): string {
  const pattern = quotePostgrestValue(`%${escapeLikeLiteral(keyword)}%`)

  return columns.map((column) => `${column}.ilike.${pattern}`).join(',')
}
