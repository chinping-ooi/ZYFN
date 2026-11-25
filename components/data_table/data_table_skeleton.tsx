"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  LEDGER_CELL_DIVIDER,
  LEDGER_HEAD_CELL_SKELETON as LEDGER_HEAD_CELL,
} from "@/components/data_table/ledger_styles";

const TRANSACTION_HEADER_WIDTHS = [
  "w-[6.75rem] max-w-[6.75rem]",
  "w-[8.5rem] max-w-[8.5rem]",
  "w-[8.5rem] max-w-[8.5rem]",
  "w-[38%] min-w-[11rem]",
  "w-[6.25rem] max-w-[6.25rem]",
  "w-[6.25rem] max-w-[6.25rem]",
  "w-[6.25rem] max-w-[6.25rem]",
];

const FD_HEADER_WIDTHS = [
  "w-[8.5rem] max-w-[8.5rem]",
  "w-[7.25rem] max-w-[7.25rem]",
  "w-[4.25rem] min-w-[4.25rem]",
  "w-[6.75rem] max-w-[6.75rem]",
  "w-[6.75rem] max-w-[6.75rem]",
  "w-[5.25rem] max-w-[5.25rem]",
  "w-[7.5rem] max-w-[7.5rem]",
  "w-[5.5rem] max-w-[5.5rem]",
];

export type DataTableSkeletonVariant = "transaction" | "fixed_deposit";

export function DataTableSkeleton({
  variant = "transaction",
  fill_height = false,
  show_bank_column = false,
  row_count = 8,
}: {
  variant?: DataTableSkeletonVariant;
  fill_height?: boolean;
  show_bank_column?: boolean;
  row_count?: number;
}) {
  const header_widths =
    variant === "fixed_deposit"
      ? show_bank_column
        ? ["w-[7rem] max-w-[7rem]", ...FD_HEADER_WIDTHS]
        : FD_HEADER_WIDTHS
      : TRANSACTION_HEADER_WIDTHS;

  const body_pad = "px-0";

  return (
    <div
      className={`flex w-full flex-col ${
        fill_height ? "min-h-0 flex-1" : "min-h-0"
      }`}
      role="status"
      aria-label="Loading table"
    >
      <div className={`data-table-toolbar shrink-0 pt-4 pb-3 ${body_pad}`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-9 w-full sm:max-w-[min(100%,320px)] sm:flex-1" />
          <Skeleton className="h-9 w-full sm:w-[5.25rem] sm:shrink-0" />
        </div>
      </div>
      <div
        className={`min-h-0 overflow-auto overscroll-contain rounded-[3px] border border-zyfn-line bg-white ${body_pad} ${
          fill_height ? "flex-1" : "max-h-[min(70vh,560px)]"
        }`}
      >
        <table className="ledger-grid-table w-full min-w-[520px] table-fixed border-collapse sm:min-w-[720px]">
          <thead>
            <tr>
              {header_widths.map((width_class, i) => (
                <th
                  key={i}
                  scope="col"
                  className={`${LEDGER_HEAD_CELL} p-0 ${width_class}`}
                >
                  <div className="flex min-h-[42px] items-center px-[13px] py-2">
                    <Skeleton className="h-3.5 w-[70%] max-w-[5.5rem]" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: row_count }, (_, row) => (
              <tr
                key={row}
                className="even:bg-[#fafbfc] last:[&>td]:border-b-0"
              >
                {header_widths.map((width_class, col) => (
                  <td
                    key={col}
                    className={`${LEDGER_CELL_DIVIDER} px-[13px] py-[11px] ${width_class}`}
                  >
                    <Skeleton
                      className={`h-3.5 ${
                        col >= header_widths.length - 3 && col > 3
                          ? "ml-auto w-[4.5rem]"
                          : col === 3
                            ? "w-[88%]"
                            : "w-[78%]"
                      }`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div
        className={`data-table-footer flex shrink-0 flex-wrap items-center justify-between gap-2 pt-3 pb-1 text-[13px] ${body_pad}`}
      >
        <Skeleton className="h-8 w-[10.5rem]" />
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="hidden h-8 w-[8.5rem] sm:block" />
          <Skeleton className="h-8 w-[17.5rem]" />
        </div>
      </div>
    </div>
  );
}