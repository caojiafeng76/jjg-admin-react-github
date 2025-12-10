/**
 * 环境变量验证工具
 */

/**
 * 验证必需的环境变量是否存在
 * @param envName - 环境变量名称
 * @param value - 环境变量的值
 * @returns 验证后的值
 * @throws Error 如果环境变量缺失或无效
 */
function validateEnvVar(envName: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(
      `环境变量 ${envName} 未设置或为空。请检查 .env 文件并确保已配置所有必需的环境变量。`,
    )
  }
  return value.trim()
}

/**
 * 验证 Supabase 环境变量
 * @returns 包含验证后的 Supabase URL 和 Key 的对象
 * @throws Error 如果环境变量缺失或无效
 */
export function validateSupabaseEnv() {
  const supabaseUrl = validateEnvVar(
    'VITE_REACT_APP_SUPABASE_URL',
    import.meta.env.VITE_REACT_APP_SUPABASE_URL,
  )

  const supabaseKey = validateEnvVar(
    'VITE_REACT_APP_SUPABASE_KEY',
    import.meta.env.VITE_REACT_APP_SUPABASE_KEY,
  )

  // 验证 URL 格式
  try {
    new URL(supabaseUrl)
  } catch {
    throw new Error(
      `环境变量 VITE_REACT_APP_SUPABASE_URL 格式无效: ${supabaseUrl}`,
    )
  }

  // 验证 Key 格式（Supabase key 通常是 JWT token，至少应该有一定长度）
  if (supabaseKey.length < 50) {
    throw new Error(
      `环境变量 VITE_REACT_APP_SUPABASE_KEY 格式可能无效（长度过短）`,
    )
  }

  return {
    supabaseUrl,
    supabaseKey,
  }
}

/**
 * 获取并验证所有必需的环境变量
 * 在应用启动时调用，确保所有环境变量都已正确配置
 */
export function validateAllEnvVars() {
  try {
    const { supabaseUrl, supabaseKey } = validateSupabaseEnv()
    return {
      supabaseUrl,
      supabaseKey,
      isValid: true,
    }
  } catch (error) {
    console.error('环境变量验证失败:', error)
    if (error instanceof Error) {
      console.error(error.message)
    }
    return {
      supabaseUrl: '',
      supabaseKey: '',
      isValid: false,
      error: error instanceof Error ? error.message : '未知错误',
    }
  }
}


