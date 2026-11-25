import type { SupabaseError, SupabaseMissing } from "@/lib/supabase/types";

export function SupabaseStatusPanel({
  result,
}: {
  result: SupabaseMissing | SupabaseError;
}) {
  return (
    <section className="rounded-[3px] border border-zyfn-line bg-white px-8 py-10 text-center">
      <h2 className="m-0 text-lg font-semibold">
        {result.kind === "missing"
          ? "Supabase not configured"
          : "Could not load Supabase data"}
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm text-zyfn-muted">{result.message}</p>
    </section>
  );
}