/** 文案由本系统编写、可直接展示给用户的优迈 SRM 错误；其他错误只对外返回通用提示 */
export class YoumaiSrmUserError extends Error {
  override name = 'YoumaiSrmUserError'
}
