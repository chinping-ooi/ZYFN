-- Import batch audit trail (insert-only imports; user must run in Supabase SQL editor).

create table if not exists public.zyfn_import_batches (
  id bigserial primary key,
  account_id bigint not null references public.zyfn_accounts (id),
  source_filename text not null,
  source_kind text not null check (source_kind in ('excel', 'csv', 'pdf', 'tng_text')),
  row_count integer not null default 0,
  inserted_count integer not null default 0,
  skipped_duplicate_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.zyfn_import_batches enable row level security;

drop policy if exists zyfn_import_batches_publishable_insert on public.zyfn_import_batches;

drop policy if exists zyfn_import_batches_publishable_select on public.zyfn_import_batches;
create policy zyfn_import_batches_publishable_select
  on public.zyfn_import_batches
  for select
  to anon, authenticated
  using (true);

grant select on public.zyfn_import_batches to anon, authenticated;

-- Transaction inserts use SUPABASE_SERVICE_ROLE_KEY in the import API (bypasses RLS).
drop policy if exists zyfn_transactions_publishable_insert on public.zyfn_transactions;