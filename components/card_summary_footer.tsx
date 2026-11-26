import type { ReactNode } from "react";

const FOOTER_CLASS =
  "chart-summary-footer relative z-10 mt-auto flex shrink-0 flex-col gap-0.5 border-t border-zyfn-line bg-white px-2 py-1.5 text-[10px] leading-snug text-zyfn-muted min-[1100px]:flex-row min-[1100px]:items-center min-[1100px]:justify-between min-[1100px]:gap-2 lg:px-3 lg:py-2 lg:text-[11px]";

export function CardSummaryFooter({
  children,
  testId,
}: {
  children: ReactNode;
  testId?: string;
}) {
  return (
    <div className={FOOTER_CLASS} data-testid={testId}>
      {children}
    </div>
  );
}

export function CardSummaryFooterMetric({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <span className="whitespace-nowrap">
      {label}
      <strong className="ml-1 text-[10px] font-semibold text-zyfn-ink lg:ml-1.5 lg:text-xs">
        {value}
      </strong>
    </span>
  );
}