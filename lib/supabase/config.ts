export function supabase_configured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_ANON_KEY?.trim(),
  );
}

export function require_supabase_env(): { url: string; anon_key: string } {
  const url = process.env.SUPABASE_URL?.trim();
  const anon_key = process.env.SUPABASE_ANON_KEY?.trim();
  if (!url || !anon_key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_ANON_KEY must be set to load account data from Supabase.",
    );
  }
  return { url, anon_key };
}