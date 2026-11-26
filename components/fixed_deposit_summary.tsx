import { format_calendar_date } from "@/lib/format/date";
import { format_money, major_to_minor } from "@/lib/format/money";
import type { FixedDepositSummary } from "@/lib/fixed_deposits/types";
import { KpiCard } from "@/components/kpi_card";

function next_maturity_meta(summary: FixedDepositSummary): string {
  if (!summary.next_maturity_date) return "—";
  const days = summary.next_maturity_days_left;
  const days_part =
    days === null
      ? ""
      : typeof days === "number"
        ? `in ${days} day${days === 1 ? "" : "s"}`
        : `in ${days}`;
  const principal_part =
    summary.next_maturity_principal_major != null
      ? `RM ${format_money(major_to_minor(summary.next_maturity_principal_major))}`
      : "";
  const receipt = summary.next_maturity_receipt ?? "";
  return [days_part, principal_part, receipt].filter(Boolean).join(" · ");
}

export function FixedDepositSummaryCards({
  summary,
}: {
  summary: FixedDepositSummary;
}) {
  return (
    <section
      className="statement-summary kpis mb-5 grid gap-[18px]"
      aria-label="Fixed deposit summary"
    >
      <KpiCard
        compact_amount
        label="Active FDs"
        primary_value={String(summary.active_count)}
        meta={`${summary.matured_count} matured`}
      />
      <KpiCard
        compact_amount
        label="Next maturity"
        primary_value={
          summary.next_maturity_date
            ? format_calendar_date(summary.next_maturity_date)
            : "—"
        }
        meta={next_maturity_meta(summary)}
      />
      <KpiCard
        compact_amount
        label="Interest earned (matured)"
        amount_sen={major_to_minor(summary.total_interest_earned_major)}
      />
      <KpiCard
        compact_amount
        label="Active principal"
        amount_sen={major_to_minor(summary.active_principal_major)}
      />
    </section>
  );
}