import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabase_public_env } from "@/lib/supabase/env";

export async function create_supabase_server_client() {
  const env = supabase_public_env();
  if (!env) {
    throw new Error("Supabase is not configured");
  }

  const cookieStore = await cookies();

  return createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          /* called from a Server Component without mutable cookies */
        }
      },
    },
  });
}