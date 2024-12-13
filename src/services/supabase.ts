import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

export const supabaseUrl = import.meta.env.VITE_REACT_APP_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_REACT_APP_SUPABASE_KEY

const supabase = createClient<Database>(supabaseUrl, supabaseKey)

export default supabase
