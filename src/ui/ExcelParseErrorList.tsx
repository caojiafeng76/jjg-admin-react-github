const MAX_VISIBLE_ERRORS = 10

export interface ExcelParseErrorListProps {
  errors: string[]
}

/** Excel 导入解析问题列表：最多展示前 10 条，其余显示剩余条数 */
export default function ExcelParseErrorList({ errors }: ExcelParseErrorListProps) {
  return (
    <ul className="mt-1 list-inside list-disc text-xs">
      {errors.slice(0, MAX_VISIBLE_ERRORS).map((error, index) => (
        // 只读、不重排的静态列表；同一条错误文案可能重复出现，不能用文案作 key
        // eslint-disable-next-line react/no-array-index-key -- 静态列表，下标即稳定身份
        <li key={index}>{error}</li>
      ))}
      {errors.length > MAX_VISIBLE_ERRORS && (
        <li>...还有 {errors.length - MAX_VISIBLE_ERRORS} 条</li>
      )}
    </ul>
  )
}
