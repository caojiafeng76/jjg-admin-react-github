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
  global: { fetch: createRetryingFetch() },
})

export default publicSupabase
