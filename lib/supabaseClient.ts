import { createBrowserClient } from '@supabase/ssr'

let supabase = null

if (typeof window !== 'undefined') {
  supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export { supabase }

