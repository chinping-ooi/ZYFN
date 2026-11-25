-- Superseded by sql/zyfn_transactions_publishable_select_rls.sql (anon + authenticated).
-- Run in the Supabase SQL editor (or migration pipeline) so the app anon key can
-- read account metadata and immutable ledger rows. Adjust if you use a dedicated
-- DB role instead of anon.

alter table public.zyfn_accounts enable row level security;
alter table public.zyfn_transactions enable row level security;

drop policy if exists zyfn_accounts_anon_select on public.zyfn_accounts;
create policy zyfn_accounts_anon_select
  on public.zyfn_accounts
  for select
  to anon
  using (true);

drop policy if exists zyfn_transactions_anon_select on public.zyfn_transactions;
create policy zyfn_transactions_anon_select
  on public.zyfn_transactions
  for select
  to anon
  using (true);

-- Optional hardening: restrict to SELECT only (immutable table already blocks writes
-- via trigger; grants below avoid accidental INSERT/UPDATE/DELETE for anon).
revoke all on public.zyfn_accounts from anon;
revoke all on public.zyfn_transactions from anon;
grant select on public.zyfn_accounts to anon;
grant select on public.zyfn_transactions to anon;