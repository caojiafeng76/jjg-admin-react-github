import { createClient } from '@supabase/supabase-js'

import { validateSupabaseEnv } from '@utils/env'

import type { Database } from './database.types'
import { createRetryingFetch } from './supabaseFetch'

const { supabaseKey, apiUrl, authStorageKey } = validateSupabaseEnv()

const publicSupabase = createClient<Database>(apiUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
    storageKey: authStorageKey,
  },
  // 网络错误重试统一由 createRetryingFetch 负责；关闭 postgrest-js 内置重试，
  // 避免两层重试叠加（最坏 3×4 次请求、十余秒后才报错）
  db: { retry: false },
  global: { fetch: createRetryingFetch() },
})

export default publicSupabase
