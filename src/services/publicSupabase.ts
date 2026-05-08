import { createClient } from '@supabase/supabase-js'

import { validateSupabaseEnv } from '@utils/env'

import type { Database } from './database.types'

const { supabaseUrl, supabaseKey } = validateSupabaseEnv()

const publicSupabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
})

export default publicSupabase
