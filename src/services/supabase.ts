import type { Database } from './database.types'
import { createClient } from '@supabase/supabase-js'
import { validateSupabaseEnv } from '@utils/env'
import { createRetryingFetch } from './supabaseFetch'

// 验证环境变量
const { supabaseUrl, supabaseKey, apiUrl, authStorageKey }
  = validateSupabaseEnv()

// 创建 Supabase 客户端
const supabase = createClient<Database>(apiUrl, supabaseKey, {
  auth: { storageKey: authStorageKey },
  // 网络错误重试统一由 createRetryingFetch 负责；关闭 postgrest-js 内置重试，
  // 避免两层重试叠加（最坏 3×4 次请求、十余秒后才报错）
  db: { retry: false },
  global: { fetch: createRetryingFetch() },
})

export { supabaseUrl }
export default supabase
