import supabase from './supabase'

export function buildAuthenticatedProxyHeaders(
  accessToken: string | null | undefined,
): Record<string, string> {
  const token = accessToken?.trim()

  if (!token) {
    throw new Error('登录状态已失效，请重新登录')
  }

  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export async function getAuthenticatedProxyHeaders(): Promise<
  Record<string, string>
> {
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    throw new Error('登录状态获取失败，请重新登录', { cause: error })
  }

  return buildAuthenticatedProxyHeaders(data.session?.access_token)
}
