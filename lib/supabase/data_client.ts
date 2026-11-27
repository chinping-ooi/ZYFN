import { createClient } from "@supabase/supabase-js";
import { supabase_public_env } from "@/lib/supabase/env";

/**
 * Read-only Supabase client for Server Components (no cookie/session refresh).
 * Avoids Next dev reload loops from @supabase/ssr set-cookie on every RSC request.
 */
export function create_supabase_data_client() {
  const env = supabase_public_env();
  if (!env) {
    throw new Error("Supabase is not configured");
  }

  return createClient(env.url, env.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}