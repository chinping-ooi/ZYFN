import type { PostgrestError } from "@supabase/supabase-js";

export function format_postgrest_error(error: PostgrestError): {
  message: string;
  details?: string;
} {
  const parts = [error.message];
  if (error.details) parts.push(error.details);
  if (error.hint) parts.push(`Hint: ${error.hint}`);
  if (error.code) parts.push(`(code ${error.code})`);
  return {
    message: parts.filter(Boolean).join(" — "),
    details: error.code ? `PostgREST ${error.code}` : undefined,
  };
}