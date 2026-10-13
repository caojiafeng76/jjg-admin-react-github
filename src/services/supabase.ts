import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'
import { validateSupabaseEnv } from '@utils/env'
import { createRetryingFetch } from './supabaseFetch'

// 验证环境变量
const { supabaseUrl, supabaseKey, apiUrl, authStorageKey } =
  validateSupabaseEnv()

// 创建 Supabase 客户端
const supabase = createClient<Database>(apiUrl, supabaseKey, {
  auth: { storageKey: authStorageKey },
  global: { fetch: createRetryingFetch() },
})

export { supabaseUrl }
export default supabase
