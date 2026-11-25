import { format_calendar_date } from "@/lib/format/date";
import { format_rm_from_major, major_to_minor } from "@/lib/format/money";
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
      className="mb-5 grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Fixed deposit summary"
    >
      <article className="rounded-[3px] border border-zyfn-line bg-white px-5 py-4">
        <div className="text-sm font-semibold text-[#526075]">
          Active principal
        </div>
        <div className="mt-2 text-2xl font-medium tabular-nums">
          {format_rm_from_major(summary.active_principal_major)}
        </div>
      </article>
      <article className="rounded-[3px] border border-zyfn-line bg-white px-5 py-4">
        <div className="text-sm font-semibold text-[#526075]">Counts</div>
        <p className="mt-2 text-sm tabular-nums">
          <span className="text-lg font-medium">{summary.active_count}</span>{" "}
          active ·{" "}
          <span className="text-lg font-medium">{summary.matured_count}</span>{" "}
          matured
        </p>
      </article>
      <article className="rounded-[3px] border border-zyfn-line bg-white px-5 py-4">
        <div className="text-sm font-semibold text-[#526075]">Next maturity</div>
        <p className="mt-2 text-sm text-zyfn-ink">{next_label}</p>
      </article>
      <KpiCard
        label="Interest earned (matured)"
        amount_sen={major_to_minor(summary.total_interest_earned_major)}
      />
    </section>
  );
}