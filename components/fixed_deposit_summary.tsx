import { format_calendar_date } from "@/lib/format/date";
import { major_to_minor } from "@/lib/format/money";
import type { FixedDepositSummary } from "@/lib/fixed_deposits/types";
import { KpiCard } from "@/components/kpi_card";

export function FixedDepositSummaryCards({
  summary,
}: {
  summary: FixedDepositSummary;
}) {
  const next_label = summary.next_maturity_date
    ? `${format_calendar_date(summary.next_maturity_date)} · ${summary.next_maturity_receipt ?? ""}`
    : "—";

  return (
    <section
      className="statement-summary kpis mb-5 grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Fixed deposit summary"
    >
      <KpiCard
        compact_amount
        label="Active principal"
        amount_sen={major_to_minor(summary.active_principal_major)}
      />
      <KpiCard
        compact_amount
        label="Counts"
        meta={
          <span className="font-medium tabular-nums text-zyfn-ink">
            {summary.active_count} active · {summary.matured_count} matured
          </span>
        }
      />
      <KpiCard
        compact_amount
        label="Next maturity"
        meta={
          <span className="leading-snug text-zyfn-ink">{next_label}</span>
        }
      />
      <KpiCard
        compact_amount
        label="Interest earned (matured)"
        amount_sen={major_to_minor(summary.total_interest_earned_major)}
      />
    </section>
  );
}