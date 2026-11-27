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
    <section className="statement-table card flex w-full flex-col rounded-[3px] border border-zyfn-line bg-white">
      <CardHead title={title} table_shell align="center" />
      <div className="flex w-full flex-col px-5 pb-4">
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