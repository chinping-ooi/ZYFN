import { createClient } from "@supabase/supabase-js";
import { require_supabase_env } from "@/lib/supabase/config";

/** Server-only read client. Never import from client components. */
export function create_supabase_server_client() {
  const { url, anon_key } = require_supabase_env();
  return createClient(url, anon_key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}