import type { ReactNode } from "react";
import { CardHead } from "@/components/card_head";
import {
  DataTableSkeleton,
  type DataTableSkeletonVariant,
} from "@/components/data_table/data_table_skeleton";

export function AccountTableCard({
  title,
  children,
  fill_height = false,
  loading = false,
  skeleton_variant = "transaction",
  skeleton_show_bank = false,
}: {
  title: string;
  children?: ReactNode;
  fill_height?: boolean;
  loading?: boolean;
  skeleton_variant?: DataTableSkeletonVariant;
  skeleton_show_bank?: boolean;
}) {
  return (
    <section
      className={`statement-table card flex flex-col rounded-[3px] border border-zyfn-line bg-white max-lg:h-auto max-lg:overflow-visible lg:min-h-0 lg:overflow-hidden ${
        fill_height ? "lg:flex-1" : ""
      }`}
    >
      <CardHead title={title} table_shell align="center" />
      <div
        className={`flex min-h-0 min-w-0 flex-col ${fill_height ? "min-h-0 flex-1" : ""} px-3 pb-4 sm:px-5`}
      >
        {loading ? (
          <DataTableSkeleton
            variant={skeleton_variant}
            fill_height={fill_height}
            show_bank_column={skeleton_show_bank}
          />
        ) : (
          children
        )}
      </div>
    </section>
  );
}