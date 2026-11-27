/**
 * Prints inflows for a dashboard month and whether is_cash_flow_excluded applies.
 * Usage: npx tsx scripts/audit_dashboard_month.mjs [YYYY-MM]
 * Requires .env.local Supabase publishable credentials.
 */
import { load_dashboard } from "../lib/dashboard/load_dashboard.ts";
import { audit_month_income } from "../lib/dashboard/month_income_audit.ts";
import { snapshot_for_month } from "../lib/dashboard/metrics.ts";

const month = (process.argv[2] ?? "2026-11").trim();

const result = await load_dashboard();
if (result.kind !== "data") {
  console.error(result.message);
  process.exit(1);
}

const snapshot = snapshot_for_month(result.metrics, month);
const lines = audit_month_income(result.statements, month);

const included_sen = lines
  .filter((l) => l.included)
  .reduce((s, l) => s + l.in_sen, 0);

console.log(`Month: ${month}`);
console.log(
  `Metric income_sen: ${snapshot?.income_sen ?? 0} · audited included sum: ${included_sen}`,
);
console.log(`Inflow rows: ${lines.length} (${lines.filter((l) => l.included).length} included)\n`);

for (const line of lines) {
  const rm = (line.in_sen / 100).toFixed(2);
  const status = line.included ? "IN" : `OUT (${line.exclusion_reason})`;
  const pair = line.pair_ref ? ` pair_ref=${line.pair_ref}` : "";
  console.log(
    `[${status}] ${line.account} ${line.date} RM ${rm} · ${line.txn_type || "—"} · ${line.description}${pair}`,
  );
}