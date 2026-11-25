-- Allow the Supabase publishable (anon) key to read immutable ledger rows.
-- Fixed deposits likely already have similar policies on zyfn_fixed_deposits /
-- zyfn_accounts; this adds the matching SELECT policy for zyfn_transactions.
--
-- Run the full script in the Supabase SQL editor (Dashboard → SQL → New query).

alter table public.zyfn_transactions enable row level security;

drop policy if exists zyfn_transactions_publishable_select on public.zyfn_transactions;
create policy zyfn_transactions_publishable_select
  on public.zyfn_transactions
  for select
  to anon, authenticated
  using (true);

grant select on public.zyfn_transactions to anon, authenticated;

-- If account lookup on HLB also fails, ensure zyfn_accounts is readable (FD join needs this too):
alter table public.zyfn_accounts enable row level security;

drop policy if exists zyfn_accounts_publishable_select on public.zyfn_accounts;
create policy zyfn_accounts_publishable_select
  on public.zyfn_accounts
  for select
  to anon, authenticated
  using (true);

grant select on public.zyfn_accounts to anon, authenticated;