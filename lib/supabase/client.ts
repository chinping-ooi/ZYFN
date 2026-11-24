import { createBrowserClient } from "@supabase/ssr";
import { supabase_public_env } from "@/lib/supabase/env";

export function create_supabase_browser_client() {
  const env = supabase_public_env();
  if (!env) {
    throw new Error("Supabase is not configured");
  }
  return createBrowserClient(env.url, env.key);
}