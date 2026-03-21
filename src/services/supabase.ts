import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'
import { validateSupabaseEnv } from '@utils/env'

// 验证环境变量
const { supabaseUrl, supabaseKey } = validateSupabaseEnv()

// 创建 Supabase 客户端
const supabase = createClient<Database>(supabaseUrl, supabaseKey)

export { supabaseUrl }
export default supabase
